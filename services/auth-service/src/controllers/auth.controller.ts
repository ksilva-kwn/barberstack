import { Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma, UserRole, Prisma } from '@barberstack/database';

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
      document:        z.string().min(11), // CNPJ sem formatação
      barbershopPhone: z.string().min(10),
      barbershopEmail: z.string().email(),
      address:         z.string().optional(),
      city:            z.string().optional(),
      state:           z.string().optional(),
      zipCode:         z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const {
      name, email, password, phone,
      barbershopName, document, barbershopPhone, barbershopEmail,
      address, city, state, zipCode,
    } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' });
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
        data: { name: barbershopName, document, phone: barbershopPhone, email: barbershopEmail, address, city, state, slug },
      });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await tx.user.create({
        data: { name, email, passwordHash, phone, role: UserRole.ADMIN, barbershopId: barbershop.id },
      });

      return { user, barbershop };
    });

    // Fire-and-forget: cria subconta Asaas em background (não bloqueia o registro)
    const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';
    fetch(`${PAYMENT_SERVICE_URL}/payments/internal/subaccount`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barbershopId: barbershop.id,
        name: barbershopName,
        email: barbershopEmail,
        cpfCnpj: document,
        phone: barbershopPhone,
        address, city, state, postalCode: zipCode,
      }),
    }).catch((err: Error) => console.error('[auth] Erro ao criar subconta Asaas:', err.message));

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
