import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { z } from 'zod';

export const subscriptionRouter = Router();

// ─── Planos (criados pelo dono da barbearia) ──────────────────────────────────
subscriptionRouter.get('/plans', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const plans = await prisma.clientPlan.findMany({
    where: { barbershopId, isActive: true },
    include: { services: { include: { service: true } } },
  });
  return res.json(plans);
});

subscriptionRouter.post('/plans', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const schema = z.object({
    name: z.string().min(2),
    price: z.number().positive(),
    billingCycle: z.enum(['monthly', 'weekly']).default('monthly'),
    description: z.string().optional(),
    serviceIds: z.array(z.string()),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { serviceIds, ...planData } = parsed.data;
  const plan = await prisma.clientPlan.create({
    data: {
      ...planData,
      barbershopId,
      services: { create: serviceIds.map((id) => ({ serviceId: id })) },
    },
    include: { services: { include: { service: true } } },
  });

  return res.status(201).json(plan);
});

// ─── Assinaturas de clientes ─────────────────────────────────────────────────
subscriptionRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { status } = req.query;

  const subscriptions = await prisma.clientSubscription.findMany({
    where: { barbershopId, ...(status ? { status: status as any } : {}) },
    include: {
      client: { select: { name: true, email: true, phone: true } },
      clientPlan: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(subscriptions);
});

// Assinar plano
subscriptionRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const schema = z.object({ clientId: z.string(), clientPlanId: z.string() });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const now = new Date();
  const end = new Date(now);
  end.setMonth(end.getMonth() + 1);

  const sub = await prisma.clientSubscription.create({
    data: {
      ...parsed.data,
      barbershopId,
      currentPeriodStart: now,
      currentPeriodEnd: end,
      nextPaymentAt: end,
    },
    include: { clientPlan: true, client: { select: { name: true } } },
  });

  return res.status(201).json(sub);
});

// Forçar recobrança (inadimplentes)
subscriptionRouter.post('/:id/force-charge', async (req: Request, res: Response) => {
  const sub = await prisma.clientSubscription.findUnique({ where: { id: req.params.id } });
  if (!sub) return res.status(404).json({ error: 'Assinatura não encontrada' });

  // TODO: integrar com payment-service para gerar cobrança no Asaas
  return res.json({ message: 'Recobrança solicitada', subscriptionId: sub.id });
});

// Cancelar assinatura
subscriptionRouter.delete('/:id', async (req: Request, res: Response) => {
  const sub = await prisma.clientSubscription.update({
    where: { id: req.params.id },
    data: { status: 'CANCELED', canceledAt: new Date() },
  });
  return res.json(sub);
});
