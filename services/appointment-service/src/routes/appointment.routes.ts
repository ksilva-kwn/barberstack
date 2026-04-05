import { Router, Request, Response } from 'express';
import { prisma, AppointmentStatus } from '@barberstack/database';
import { z } from 'zod';

export const appointmentRouter = Router();

const createSchema = z.object({
  professionalId: z.string(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  scheduledAt: z.string().datetime(),
  serviceIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
  origin: z.enum(['APP', 'RECEPTION']).default('RECEPTION'),
});

// Listar agendamentos com filtros (data, profissional)
appointmentRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { date, professionalId, status } = req.query;

  const where: any = { barbershopId };

  if (date) {
    const day = new Date(date as string);
    where.scheduledAt = {
      gte: new Date(day.setHours(0, 0, 0, 0)),
      lte: new Date(day.setHours(23, 59, 59, 999)),
    };
  }

  if (professionalId) where.professionalId = professionalId;
  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      professional: { include: { user: { select: { name: true } } } },
      services: { include: { service: true } },
      client: { select: { name: true, phone: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return res.json(appointments);
});

// Criar agendamento
appointmentRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { serviceIds, scheduledAt, ...rest } = parsed.data;

  // Busca serviços para calcular duração e valor total
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, barbershopId },
  });

  const totalAmount = services.reduce((sum, s) => sum + Number(s.price), 0);
  const durationMins = services.reduce((sum, s) => sum + s.durationMins, 0);

  const appointment = await prisma.appointment.create({
    data: {
      barbershopId,
      ...rest,
      scheduledAt: new Date(scheduledAt),
      totalAmount,
      durationMins,
      services: {
        create: services.map((s) => ({
          serviceId: s.id,
          price: s.price,
          durationMins: s.durationMins,
        })),
      },
    },
    include: { services: { include: { service: true } } },
  });

  return res.status(201).json(appointment);
});

// Atualizar status do agendamento (Chegou, Finalizou, Faltou, etc.)
appointmentRouter.patch('/:id/status', async (req: Request, res: Response) => {
  const { status } = req.body;
  const validStatuses = Object.values(AppointmentStatus);
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Status inválido. Use: ${validStatuses.join(', ')}` });
  }

  const updates: any = { status };
  if (status === 'IN_PROGRESS') updates.startedAt = new Date();
  if (status === 'COMPLETED') updates.completedAt = new Date();
  if (status === 'CANCELED') updates.canceledAt = new Date();
  if (status === 'CONFIRMED') updates.confirmedAt = new Date();

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: updates,
  });

  return res.json(appointment);
});

// Heatmap de ocupação (últimos 30 dias)
appointmentRouter.get('/heatmap', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const appointments = await prisma.appointment.findMany({
    where: {
      barbershopId,
      scheduledAt: { gte: thirtyDaysAgo },
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    select: { scheduledAt: true },
  });

  // Agrega por hora do dia e dia da semana
  const heatmap: Record<string, number> = {};
  for (const apt of appointments) {
    const day = apt.scheduledAt.getDay(); // 0-6
    const hour = apt.scheduledAt.getHours(); // 0-23
    const key = `${day}-${hour}`;
    heatmap[key] = (heatmap[key] || 0) + 1;
  }

  return res.json(heatmap);
});
