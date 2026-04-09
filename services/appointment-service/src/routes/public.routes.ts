import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import jwt from 'jsonwebtoken';

export const publicAppointmentRouter: Router = Router();

// Slots disponíveis (sem auth — barbershopId via query param)
publicAppointmentRouter.get('/slots', async (req: Request, res: Response) => {
  const { barbershopId, professionalId, date, durationMins } = req.query;

  if (!barbershopId || !professionalId || !date) {
    return res.status(400).json({ error: 'barbershopId, professionalId e date são obrigatórios' });
  }

  const duration = parseInt(durationMins as string) || 30;
  const [year, month, day] = (date as string).split('-').map(Number);

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay   = new Date(year, month - 1, day, 23, 59, 59);

  const existing = await prisma.appointment.findMany({
    where: {
      barbershopId: barbershopId as string,
      professionalId: professionalId as string,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    select: { scheduledAt: true, durationMins: true },
  });

  const BUSINESS_START = 8 * 60;
  const BUSINESS_END   = 20 * 60;
  const SLOT_INTERVAL  = 30;

  // Normaliza os agendamentos existentes para minutos desde meia-noite LOCAL
  const existingLocal = existing.map((apt) => {
    const d = new Date(apt.scheduledAt);
    const startMin = d.getHours() * 60 + d.getMinutes();
    return { startMin, endMin: startMin + apt.durationMins };
  });

  const slots = [];
  for (let min = BUSINESS_START; min + duration <= BUSINESS_END; min += SLOT_INTERVAL) {
    const slotEnd = min + duration;
    const overlaps = existingLocal.some(({ startMin, endMin }) =>
      min < endMin && slotEnd > startMin
    );

    const h = Math.floor(min / 60).toString().padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    slots.push({ time: `${h}:${m}`, available: !overlaps });
  }

  return res.json(slots);
});

// Criar agendamento pelo portal do cliente (requer token do cliente via Authorization header)
publicAppointmentRouter.post('/appointments', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token necessário para agendar' });
  }

  let clientId: string;
  let barbershopId: string;

  try {
    const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!) as any;
    clientId = payload.sub;
    barbershopId = payload.barbershopId;
    if (!barbershopId) return res.status(403).json({ error: 'Usuário sem barbearia associada' });
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const { professionalId, scheduledAt, serviceIds, notes } = req.body;
  if (!professionalId || !scheduledAt || !serviceIds?.length) {
    return res.status(400).json({ error: 'professionalId, scheduledAt e serviceIds são obrigatórios' });
  }

  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, barbershopId },
  });

  const totalAmount = services.reduce((sum, s) => sum + Number(s.price), 0);
  const durationMins = services.reduce((sum, s) => sum + s.durationMins, 0);

  const appointment = await prisma.appointment.create({
    data: {
      barbershopId,
      professionalId,
      clientId,
      scheduledAt: new Date(scheduledAt),
      totalAmount,
      durationMins,
      origin: 'APP',
      notes,
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
