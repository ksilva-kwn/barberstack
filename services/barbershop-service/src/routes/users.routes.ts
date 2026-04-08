import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const usersRouter: Router = Router();

// Listar clientes da barbearia
usersRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { search } = req.query;

  const where: any = { barbershopId, role: 'CLIENT', isActive: true };
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { phone: { contains: search as string } },
      { email: { contains: search as string, mode: 'insensitive' } },
    ];
  }

  const clients = await prisma.user.findMany({
    where,
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
    orderBy: { name: 'asc' },
    take: 50,
  });

  return res.json(clients);
});

// Cadastrar novo cliente
const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6).default('barberstack123'),
});

usersRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, email, phone, password } = parsed.data;

  const exists = await prisma.user.findFirst({ where: { email, barbershopId } });
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { barbershopId, name, email, phone, passwordHash, role: 'CLIENT' },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });

  return res.status(201).json(user);
});

// Criar barbeiro (User BARBER + Professional)
const barberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10).optional(),
  password: z.string().min(6),
  nickname: z.string().optional(),
  commissionRate: z.number().min(0).max(100).default(40),
});

usersRouter.post('/barber', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = barberSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { name, email, phone, password, nickname, commissionRate } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });

  const passwordHash = await bcrypt.hash(password, 10);

  const professional = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { barbershopId, name, email, phone, passwordHash, role: 'BARBER' },
    });
    return tx.professional.create({
      data: { barbershopId, userId: user.id, nickname, commissionRate },
      include: { user: { select: { name: true, email: true, phone: true } } },
    });
  });

  return res.status(201).json(professional);
});
