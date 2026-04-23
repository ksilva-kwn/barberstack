import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, UserRole, Prisma } from '@barberstack/database';
import { logger } from '@barberstack/logger';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  barbershopId: z.string().optional(),
});

export class AuthController {
  login = async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: { barbershop: { select: { id: true, name: true, saasPlan: true, slug: true } } },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return res.json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        barbershopId: user.barbershopId,
        barbershop: user.barbershop,
      },
    });
  };

  register = async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { name, email, password, phone, barbershopId } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone, barbershopId, role: 'CLIENT' },
    });

    const token = this.generateToken(user);

    return res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  };

  refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken obrigatório' });
    }

    const stored = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      return res.status(401).json({ error: 'Refresh token inválido ou expirado' });
    }

    const newToken = this.generateToken(stored.user);
    return res.json({ token: newToken });
  };

  logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    }
    return res.json({ message: 'Logout realizado com sucesso' });
  };

  me = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string };
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, email: true, role: true, barbershopId: true, phone: true, avatarUrl: true },
      });
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
      return res.json(user);
    } catch {
      return res.status(401).json({ error: 'Token inválido' });
    }
  };

  registerBarbershop = async (req: Request, res: Response) => {
    const schema = z.object({
      // Dados do dono
      name:     z.string().min(2),
      email:    z.string().email(),
      password: z.string().min(6),
      phone:    z.string().optional(),
      // Dados da barbearia
      barbershopName:  z.string().min(2),
      document:        z.string().min(11).max(14), // CPF (11) ou CNPJ (14) sem formatação
      barbershopPhone: z.string().min(10),
      barbershopEmail: z.string().email(),
      address:         z.string().optional(),
      city:            z.string().optional(),
      state:           z.string().optional(),
      zipCode:         z.string().optional(),
      companyType:     z.string().optional(),
      incomeValue:     z.number().positive().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const {
      name, email, password, phone,
      barbershopName, document, barbershopPhone, barbershopEmail,
      address, city, state, zipCode, companyType, incomeValue,
    } = parsed.data;

    const [existingUser, existingShop] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.barbershop.findUnique({ where: { document } }),
    ]);
    if (existingShop) {
      return res.status(409).json({ error: 'CPF/CNPJ já cadastrado. Faça login ou recupere seu acesso.' });
    }
    if (existingUser) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const baseSlug = barbershopName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 50);
    let slug = baseSlug;
    let counter = 2;
    while (await prisma.barbershop.findUnique({ where: { slug } })) {
      slug = `${baseSlug}${counter++}`;
    }

    const { user, barbershop } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const barbershop = await tx.barbershop.create({
        data: {
          name: barbershopName, document, phone: barbershopPhone, email: barbershopEmail,
          address, city, state, zipCode, companyType,
          incomeValue: incomeValue ? incomeValue : undefined,
          slug,
        },
      });

      await tx.barbershopBranch.create({
        data: {
          barbershopId: barbershop.id,
          name: barbershopName,
          phone: barbershopPhone,
          email: barbershopEmail,
          address: address ?? null,
          city: city ?? null,
          state: state ?? null,
          zipCode: zipCode ?? null,
          isMain: true,
        },
      });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await tx.user.create({
        data: { name, email, passwordHash, phone, role: UserRole.ADMIN, barbershopId: barbershop.id },
      });

      return { user, barbershop };
    });

    // Subconta Asaas criada manualmente pelo usuário dentro do app (Assinaturas → Ativar)

    const token = this.generateToken({ ...user, barbershopId: barbershop.id });
    const refreshToken = this.generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return res.status(201).json({
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        barbershopId: barbershop.id,
        barbershop: { id: barbershop.id, name: barbershop.name, saasPlan: barbershop.saasPlan },
      },
    });
  };

  deleteAccount = async (req: Request, res: Response) => {
    // Headers injetados pelo authMiddleware do API Gateway
    const userId       = req.headers['x-user-id'] as string;
    const barbershopId = req.headers['x-barbershop-id'] as string;

    if (!userId || !barbershopId) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    try {

      if (!barbershopId) {
        return res.status(400).json({ error: 'Conta sem barbearia vinculada' });
      }

      // Verifica saldo Asaas antes de deletar subconta
      let asaasSkipped = false;
      const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
      try {
        const balanceRes = await fetch(`${PAYMENT_SERVICE_URL}/payments/balance`, {
          headers: { 'x-barbershop-id': barbershopId },
        });
        const balanceData = await balanceRes.json() as { balance: number; configured: boolean };
        if (balanceData.configured && balanceData.balance > 0) {
          asaasSkipped = true; // Tem saldo — não fecha subconta Asaas
        } else if (balanceData.configured) {
          // Sem saldo — fecha subconta Asaas (fire-and-forget)
          fetch(`${PAYMENT_SERVICE_URL}/payments/internal/close-account`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json', 'x-barbershop-id': barbershopId },
          }).catch(() => {});
        }
      } catch { /* ignora erro do Asaas — deleta mesmo assim */ }

      // Deleta barbearia (cascade apaga usuários, assinaturas, agendamentos, etc.)
      await prisma.barbershop.delete({ where: { id: barbershopId } });

      // Deleta usuário se ainda existir
      await prisma.user.deleteMany({ where: { id: userId } });

      return res.json({ ok: true, asaasSkipped });
    } catch (err: any) {
      logger.error(barbershopId ?? 'auth-service', `[deleteAccount] ${err?.message}`);
      return res.status(500).json({ error: 'Erro ao excluir conta. Tente novamente.' });
    }
  };

  private generateToken(user: { id: string; email: string; role: string; barbershopId?: string | null }) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        barbershopId: user.barbershopId ?? null,
        type: 'access',
      },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' as any },
    );
  }

  private generateRefreshToken(userId: string) {
    return jwt.sign({ sub: userId, type: 'refresh' }, process.env.JWT_SECRET!, { expiresIn: '7d' as any });
  }
}
