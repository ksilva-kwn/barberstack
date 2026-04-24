import { Router, Request, Response } from 'express';
import { prisma, AppointmentStatus } from '@barberstack/database';
import { z } from 'zod';

export const appointmentRouter: Router = Router();

const createSchema = z.object({
  professionalId: z.string(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  scheduledAt: z.string().datetime({ offset: true }),
  serviceIds: z.array(z.string()).min(1),
  notes: z.string().optional(),
  origin: z.enum(['APP', 'RECEPTION']).default('RECEPTION'),
});

// Listar agendamentos com filtros (data, profissional)
appointmentRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { date, dateFrom, dateTo, professionalId, status } = req.query;

  const where: any = { barbershopId };

  if (date) {
    const [y, m, d] = (date as string).split('-').map(Number);
    where.scheduledAt = {
      gte: new Date(y, m - 1, d, 0, 0, 0),
      lte: new Date(y, m - 1, d, 23, 59, 59),
    };
  } else if (dateFrom || dateTo) {
    where.scheduledAt = {};
    if (dateFrom) {
      const [y, m, d] = (dateFrom as string).split('-').map(Number);
      where.scheduledAt.gte = new Date(y, m - 1, d, 0, 0, 0);
    }
    if (dateTo) {
      const [y, m, d] = (dateTo as string).split('-').map(Number);
      where.scheduledAt.lte = new Date(y, m - 1, d, 23, 59, 59);
    }
  }

  if (professionalId) where.professionalId = professionalId;
  if (status) where.status = status;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      professional: { include: { user: { select: { name: true } } } },
      services: { include: { service: true } },
      client: { select: { name: true, phone: true } },
      appointmentProducts: { include: { product: true } },
      clientSubscription: { select: { id: true } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  return res.json(appointments);
});

// Criar agendamento
appointmentRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
    return res.status(400).json({ error: msgs[0] ?? 'Dados inválidos' });
  }

  const { serviceIds, scheduledAt, ...rest } = parsed.data;

  // Busca serviços para calcular duração e valor total
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds }, barbershopId },
  });

  // Verifica assinatura ativa do cliente (se houver clientId)
  const clientId = (rest as any).clientId as string | undefined;
  const activeSub = clientId ? await prisma.clientSubscription.findFirst({
    where: { clientId, barbershopId, status: 'ACTIVE' },
    include: { clientPlan: { include: { services: { select: { serviceId: true } } } } },
  }) : null;
  const coveredIds = new Set(activeSub?.clientPlan.services.map(s => s.serviceId) ?? []);

  const durationMins = services.reduce((sum, s) => sum + s.durationMins, 0);
  const totalAmount = services.reduce((sum, s) => sum + (coveredIds.has(s.id) ? 0 : Number(s.price)), 0);

  const appointment = await prisma.appointment.create({
    data: {
      barbershopId,
      ...rest,
      scheduledAt: new Date(scheduledAt),
      totalAmount,
      durationMins,
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

// Atualizar agendamento completo (cliente, horário, serviços, observações)
appointmentRouter.patch('/:id', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { clientId, clientName, notes, serviceIds, scheduledAt, professionalId } = req.body;

  const updateData: any = {};
  if (notes !== undefined)         updateData.notes         = notes;
  if (scheduledAt !== undefined)   updateData.scheduledAt   = new Date(scheduledAt);
  if (professionalId !== undefined) updateData.professionalId = professionalId;

  // Client: prefer linked clientId, else free-text name
  if (clientId !== undefined)     { updateData.clientId = clientId; updateData.clientName = null; }
  else if (clientName !== undefined) { updateData.clientName = clientName; updateData.clientId = null; }

  // Services: if provided, recalculate duration + totalAmount
  if (Array.isArray(serviceIds) && serviceIds.length > 0) {
    const services = await prisma.service.findMany({
      where: { id: { in: serviceIds }, barbershopId },
    });
    const resolvedClientId = clientId ?? (await prisma.appointment.findUnique({ where: { id: req.params.id }, select: { clientId: true } }))?.clientId;
    const subForUpdate = resolvedClientId ? await prisma.clientSubscription.findFirst({
      where: { clientId: resolvedClientId, barbershopId, status: 'ACTIVE' },
      include: { clientPlan: { include: { services: { select: { serviceId: true } } } } },
    }) : null;
    const coveredIdsUpdate = new Set(subForUpdate?.clientPlan.services.map(s => s.serviceId) ?? []);

    updateData.durationMins = services.reduce((s, sv) => s + sv.durationMins, 0);
    updateData.totalAmount  = services.reduce((s, sv) => s + (coveredIdsUpdate.has(sv.id) ? 0 : Number(sv.price)), 0);
    if (subForUpdate) updateData.clientSubscriptionId = subForUpdate.id;
    updateData.services = {
      deleteMany: {},
      create: services.map(sv => ({ serviceId: sv.id, price: coveredIdsUpdate.has(sv.id) ? 0 : sv.price, durationMins: sv.durationMins })),
    };
  }

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      professional: { include: { user: { select: { name: true } } } },
      services: { include: { service: true } },
      client: { select: { name: true, phone: true } },
      appointmentProducts: { include: { product: true } },
      clientSubscription: { select: { id: true } },
    },
  });

  return res.json(appointment);
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

// Excluir agendamento
appointmentRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.appointment.delete({ where: { id: req.params.id } });
  return res.status(204).send();
});

// Reagendar (mover horário)
appointmentRouter.patch('/:id/reschedule', async (req: Request, res: Response) => {
  const { scheduledAt } = req.body;
  if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt obrigatório' });

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { scheduledAt: new Date(scheduledAt) },
  });
  return res.json(appointment);
});

// Redimensionar duração (resize pelo card)
appointmentRouter.patch('/:id/duration', async (req: Request, res: Response) => {
  const { durationMins } = req.body;
  if (!durationMins || durationMins < 15) return res.status(400).json({ error: 'durationMins mínimo: 15' });

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { durationMins: Math.round(durationMins) },
  });
  return res.json(appointment);
});

// Registrar pagamento de comanda
appointmentRouter.patch('/:id/payment', async (req: Request, res: Response) => {
  const { paymentStatus, paymentMethod } = req.body;
  if (!['PENDING', 'PAID'].includes(paymentStatus)) {
    return res.status(400).json({ error: 'paymentStatus deve ser PENDING ou PAID' });
  }

  // Busca estado ATUAL antes de alterar (idempotência)
  const current = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: { paymentStatus: true, appointmentProducts: { select: { productId: true, quantity: true } } },
  });
  if (!current) return res.status(404).json({ error: 'Agendamento não encontrado' });

  const updates: any = { paymentStatus };
  if (paymentStatus === 'PAID') {
    updates.paidAt = new Date();
    if (paymentMethod) updates.paymentMethod = paymentMethod;
  } else {
    updates.paidAt = null;
    updates.paymentMethod = null;
  }

  const appointment = await prisma.appointment.update({
    where: { id: req.params.id },
    data: updates,
    include: {
      professional: { include: { user: { select: { name: true } } } },
      services: { include: { service: true } },
      client: { select: { name: true, phone: true } },
      appointmentProducts: { include: { product: true } },
    },
  });

  const products = current.appointmentProducts;

  if (products.length > 0) {
    // Agrupa por productId somando quantidades (evita múltiplos decrements do mesmo produto)
    const deltas = products.reduce<Record<string, number>>((acc, ap) => {
      acc[ap.productId] = (acc[ap.productId] ?? 0) + ap.quantity;
      return acc;
    }, {});

    if (paymentStatus === 'PAID' && current.paymentStatus !== 'PAID') {
      // PENDING → PAID: desconta estoque
      await Promise.all(
        Object.entries(deltas).map(([productId, qty]) =>
          prisma.product.update({ where: { id: productId }, data: { stock: { decrement: qty } } })
        )
      );
    } else if (paymentStatus === 'PENDING' && current.paymentStatus === 'PAID') {
      // PAID → PENDING (reabrir): devolve estoque
      await Promise.all(
        Object.entries(deltas).map(([productId, qty]) =>
          prisma.product.update({ where: { id: productId }, data: { stock: { increment: qty } } })
        )
      );
    }
    // Se o status não mudou (chamada duplicada), não faz nada
  }

  return res.json(appointment);
});

// Adicionar produto à comanda
appointmentRouter.post('/:id/products', async (req: Request, res: Response) => {
  const { productId, quantity = 1 } = req.body;
  if (!productId) return res.status(400).json({ error: 'productId obrigatório' });

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: { paymentStatus: true },
  });

  const item = await prisma.appointmentProduct.create({
    data: {
      appointmentId: req.params.id,
      productId,
      quantity: Number(quantity),
      price: product.price,
    },
    include: { product: true },
  });

  // Se comanda já está paga, decrementa estoque imediatamente
  if (appointment?.paymentStatus === 'PAID') {
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: Number(quantity) } },
    });
  }

  return res.status(201).json(item);
});

// Remover produto da comanda
appointmentRouter.delete('/:id/products/:itemId', async (req: Request, res: Response) => {
  const item = await prisma.appointmentProduct.findUnique({
    where: { id: req.params.itemId },
    select: { productId: true, quantity: true, appointmentId: true },
  });

  if (!item || item.appointmentId !== req.params.id) {
    return res.status(404).json({ error: 'Item não encontrado' });
  }

  const appointment = await prisma.appointment.findUnique({
    where: { id: req.params.id },
    select: { paymentStatus: true },
  });

  await prisma.appointmentProduct.delete({ where: { id: req.params.itemId } });

  // Se comanda já está paga, devolve estoque ao remover o item
  if (appointment?.paymentStatus === 'PAID') {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }

  return res.status(204).send();
});

// Horários disponíveis de um profissional em uma data
appointmentRouter.get('/available-slots', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { professionalId, date, durationMins } = req.query;

  if (!professionalId || !date) {
    return res.status(400).json({ error: 'professionalId e date são obrigatórios' });
  }

  const duration = parseInt(durationMins as string) || 30;
  const [year, month, day] = (date as string).split('-').map(Number);

  const startOfDay = new Date(year, month - 1, day, 0, 0, 0);
  const endOfDay   = new Date(year, month - 1, day, 23, 59, 59);

  const existing = await prisma.appointment.findMany({
    where: {
      barbershopId,
      professionalId: professionalId as string,
      scheduledAt: { gte: startOfDay, lte: endOfDay },
      status: { notIn: ['CANCELED', 'NO_SHOW'] },
    },
    select: { scheduledAt: true, durationMins: true },
  });

  const BUSINESS_START = 8 * 60;  // 08:00
  const BUSINESS_END   = 20 * 60; // 20:00
  const SLOT_INTERVAL  = 15;

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
