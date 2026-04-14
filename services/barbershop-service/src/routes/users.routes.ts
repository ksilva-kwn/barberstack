import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '@barberstack/database';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

export const usersRouter: Router = Router();

// Listar clientes da barbearia
usersRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { search, blocked } = req.query;

  const where: any = {
    barbershopId,
    role: 'CLIENT',
    isActive: blocked === 'true' ? false : true,
  };
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
    take: 100,
  });

  return res.json(clients);
});

// Stats de clientes (relatórios)
usersRouter.get('/stats', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixtyDaysAgo  = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  // Buscar dados brutos via SQL para evitar problemas de tipo com Prisma relations
  const [totalActive, totalBlocked, newLast30, rawAppointments] = await Promise.all([
    prisma.user.count({ where: { barbershopId, role: 'CLIENT', isActive: true } }),
    prisma.user.count({ where: { barbershopId, role: 'CLIENT', isActive: false } }),
    prisma.user.count({ where: { barbershopId, role: 'CLIENT', isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.$queryRaw<Array<{
      clientId: string | null;
      clientName: string | null;
      scheduledAt: Date;
      totalPrice: number;
    }>>`
      SELECT
        a."clientId",
        u."name" AS "clientName",
        a."scheduledAt",
        COALESCE(SUM(aps."price"), 0)::float AS "totalPrice"
      FROM "appointments" a
      LEFT JOIN "users" u ON u."id" = a."clientId"
      LEFT JOIN "appointment_services" aps ON aps."appointmentId" = a."id"
      WHERE a."barbershopId" = ${barbershopId} AND a."status" = 'COMPLETED'
      GROUP BY a."id", u."name"
      ORDER BY a."scheduledAt" DESC
    `,
  ]);

  // Agregar por cliente
  const visitMap = new Map<string, { name: string; visits: number; revenue: number; lastVisit: Date }>();
  for (const row of rawAppointments) {
    if (!row.clientId) continue;
    const existing = visitMap.get(row.clientId);
    if (existing) {
      existing.visits += 1;
      existing.revenue += Number(row.totalPrice);
      if (row.scheduledAt > existing.lastVisit) existing.lastVisit = row.scheduledAt;
    } else {
      visitMap.set(row.clientId, {
        name: row.clientName ?? 'Desconhecido',
        visits: 1,
        revenue: Number(row.totalPrice),
        lastVisit: row.scheduledAt,
      });
    }
  }

  const topByVisits = [...visitMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, 10);

  const topByRevenue = [...visitMap.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const inactiveCount = [...visitMap.values()].filter(v => v.lastVisit < sixtyDaysAgo).length;

  // Novos clientes por mês (últimos 6 meses)
  const newByMonth: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = await prisma.user.count({
      where: { barbershopId, role: 'CLIENT', isActive: true, createdAt: { gte: d, lt: end } },
    });
    newByMonth.push({
      month: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
      count,
    });
  }

  // Dia da semana mais popular
  const dowCount = [0, 0, 0, 0, 0, 0, 0];
  for (const row of rawAppointments) {
    dowCount[new Date(row.scheduledAt).getDay()] += 1;
  }
  const dowLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const preferredDow = dowCount.map((count, i) => ({ day: dowLabels[i], count }));

  return res.json({ totalActive, totalBlocked, newLast30, inactiveCount, topByVisits, topByRevenue, newByMonth, preferredDow });
});

// Cadastrar novo cliente
const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6).default('barberstack123'),
});

usersRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = clientSchema.safeParse(req.body);
  if (!parsed.success) {
    const msgs = Object.entries(parsed.error.flatten().fieldErrors)
      .flatMap(([, errs]) => errs as string[]);
    return res.status(400).json({ error: msgs[0] ?? 'Dados inválidos' });
  }

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

// Bloquear / desbloquear cliente
usersRouter.patch('/:id/block', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { blocked } = req.body; // boolean
  const user = await prisma.user.updateMany({
    where: { id: req.params.id, barbershopId, role: 'CLIENT' },
    data: { isActive: !blocked },
  });
  if (user.count === 0) return res.status(404).json({ error: 'Cliente não encontrado' });
  return res.json({ success: true });
});

// Criar barbeiro (User BARBER + Professional)
const barberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
  nickname: z.string().optional(),
  commissionRate: z.number().min(0).max(100).default(40),
});

usersRouter.post('/barber', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = barberSchema.safeParse(req.body);
  if (!parsed.success) {
    const msgs = Object.entries(parsed.error.flatten().fieldErrors)
      .flatMap(([, errs]) => errs as string[]);
    return res.status(400).json({ error: msgs[0] ?? 'Dados inválidos' });
  }

  const { name, email, phone, password, nickname, commissionRate } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ error: 'E-mail já cadastrado' });

  const passwordHash = await bcrypt.hash(password, 10);

  const professional = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
