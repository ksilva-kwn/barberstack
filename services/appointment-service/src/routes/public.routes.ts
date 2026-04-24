import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import jwt from 'jsonwebtoken';

export const publicAppointmentRouter: Router = Router();

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

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

  // Blocos de tempo que devem estar indisponíveis (além de agendamentos existentes)
  const partialBlocks: { startMin: number; endMin: number }[] = [];
  const dateStr = date as string;

  try {
    const dayOff = await prisma.professionalDayOff.findUnique({
      where: { professionalId_date: { professionalId: professionalId as string, date: dateStr } },
    });
    if (dayOff) {
      if (!dayOff.startTime || !dayOff.endTime) {
        // Dia inteiro de folga — todos os slots indisponíveis
        const slots = [];
        for (let min = 8 * 60; min + duration <= 20 * 60; min += 15) {
          const h = Math.floor(min / 60).toString().padStart(2, '0');
          const m = (min % 60).toString().padStart(2, '0');
          slots.push({ time: `${h}:${m}`, available: false });
        }
        return res.json(slots);
      }
      // Folga parcial — bloqueia apenas o intervalo
      const [sh, sm] = dayOff.startTime.split(':').map(Number);
      const [eh, em] = dayOff.endTime.split(':').map(Number);
      partialBlocks.push({ startMin: sh * 60 + sm, endMin: eh * 60 + em });
    }
  } catch {
    // Migração pendente — ignora
  }

  // Bloqueios recorrentes (almoço, etc.)
  try {
    const refDate = new Date(year, month - 1, day);
    const dow = refDate.getDay(); // 0=Dom ... 6=Sáb
    const recurring = await (prisma as any).professionalRecurringBlock.findMany({
      where: {
        professionalId: professionalId as string,
        isActive: true,
        OR: [{ dayOfWeek: dow }, { dayOfWeek: null }],
      },
    });
    for (const block of recurring) {
      const [sh, sm] = block.startTime.split(':').map(Number);
      const [eh, em] = block.endTime.split(':').map(Number);
      partialBlocks.push({ startMin: sh * 60 + sm, endMin: eh * 60 + em });
    }
  } catch {
    // Migração pendente — ignora
  }

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

  // Intervalo dinâmico: MDC de todos os serviços ativos da barbearia
  // Cada barbearia tem seu próprio intervalo automático baseado nos tempos de serviço
  const activeServices = await prisma.service.findMany({
    where: { barbershopId: barbershopId as string, isActive: true },
    select: { durationMins: true },
  });
  const durations = activeServices.map(s => s.durationMins).filter(d => d > 0);
  const rawInterval = durations.length > 0 ? durations.reduce(gcd) : 15;
  const SLOT_INTERVAL = Math.min(Math.max(rawInterval, 5), 30); // clamp 5–30min

  // Normaliza os agendamentos existentes para minutos BRT (TZ=America/Sao_Paulo no container)
  const existingLocal = existing.map((apt) => {
    const d = new Date(apt.scheduledAt);
    // getHours() usa o TZ do processo (America/Sao_Paulo via env)
    const startMin = d.getHours() * 60 + d.getMinutes();
    return { startMin, endMin: startMin + apt.durationMins };
  });

  const slots = [];
  for (let min = BUSINESS_START; min + duration <= BUSINESS_END; min += SLOT_INTERVAL) {
    const slotEnd = min + duration;
    // Bloqueia slots que COMEÇAM dentro do agendamento (não antes)
    // Ex: agendamento 14:00-14:40 → bloqueia 14:00, 14:10, 14:20, 14:30 — não 13:50
    const overlapsApt = existingLocal.some(({ startMin, endMin }) =>
      min >= startMin && min < endMin
    );
    const overlapsBlock = partialBlocks.some(({ startMin, endMin }) =>
      min >= startMin && min < endMin
    );

    const h = Math.floor(min / 60).toString().padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    slots.push({ time: `${h}:${m}`, available: !overlapsApt && !overlapsBlock });
  }

  return res.json(slots);
});

// Listar agendamentos do cliente logado no portal
publicAppointmentRouter.get('/my-appointments', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token necessário' });
  }

  let clientId: string;
  let barbershopId: string | undefined;
  try {
    const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!) as any;
    clientId = payload.sub;
    barbershopId = payload.barbershopId ?? undefined;
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const now = new Date();
  const baseWhere = { clientId, ...(barbershopId ? { barbershopId } : {}) };

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: { ...baseWhere, scheduledAt: { gte: now }, status: { notIn: ['CANCELED', 'NO_SHOW'] } },
      include: {
        professional: { include: { user: { select: { name: true, avatarUrl: true } } } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    }),
    prisma.appointment.findMany({
      where: { ...baseWhere, scheduledAt: { lt: now }, status: { notIn: ['CANCELED', 'NO_SHOW'] } },
      include: {
        professional: { include: { user: { select: { name: true, avatarUrl: true } } } },
        services: { include: { service: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
    }),
  ]);

  return res.json({ upcoming, past });
});

// Cancelar agendamento pelo portal (cliente pode cancelar próprio agendamento futuro)
publicAppointmentRouter.patch('/appointments/:id/cancel', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token necessário' });
  }

  let clientId: string;
  try {
    const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET!) as any;
    clientId = payload.sub;
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: { clientId: true, scheduledAt: true, status: true },
  });

  if (!appointment) return res.status(404).json({ error: 'Agendamento não encontrado' });
  if (appointment.clientId !== clientId) return res.status(403).json({ error: 'Sem permissão' });
  if (appointment.scheduledAt <= new Date()) return res.status(400).json({ error: 'Não é possível cancelar agendamentos já realizados' });
  if (['CANCELED', 'COMPLETED', 'NO_SHOW'].includes(appointment.status)) {
    return res.status(400).json({ error: 'Agendamento não pode ser cancelado' });
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CANCELED', canceledAt: new Date() },
  });

  return res.json(updated);
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

  // Verifica assinatura ativa do cliente nesta barbearia
  const activeSub = await prisma.clientSubscription.findFirst({
    where: { clientId, barbershopId, status: 'ACTIVE' },
    include: { clientPlan: { include: { services: { select: { serviceId: true } } } } },
  });
  const coveredIds = new Set(activeSub?.clientPlan.services.map(s => s.serviceId) ?? []);

  const durationMins = services.reduce((sum, s) => sum + s.durationMins, 0);
  const totalAmount = services.reduce((sum, s) => sum + (coveredIds.has(s.id) ? 0 : Number(s.price)), 0);

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
      ...(activeSub && { clientSubscriptionId: activeSub.id }),
      services: {
        create: services.map((s) => ({
          serviceId: s.id,
          price: coveredIds.has(s.id) ? 0 : s.price,
          durationMins: s.durationMins,
        })),
      },
    },
    include: { services: { include: { service: true } } },
  });

  return res.status(201).json(appointment);
});
