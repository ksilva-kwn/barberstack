import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { z } from 'zod';

export const subscriptionRouter: Router = Router();

const PAYMENT_SERVICE_URL =
  process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addMonths(date: Date, n: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
}

function toYMD(date: Date) {
  return date.toISOString().split('T')[0];
}

// Chama o payment-service para criar/cancelar assinatura Asaas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function callPaymentService(path: string, method: 'POST' | 'DELETE', body?: object): Promise<any> {
  try {
    const res = await fetch(`${PAYMENT_SERVICE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return res.json();
  } catch (err) {
    console.error('[subscription] Erro ao chamar payment-service:', err);
  }
  return null;
}

// ─── PLANOS ───────────────────────────────────────────────────────────────────

// GET /plans — ativos
subscriptionRouter.get('/plans', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const includeInactive = req.query.all === 'true';

  const plans = await prisma.clientPlan.findMany({
    where: { barbershopId, ...(includeInactive ? {} : { isActive: true }) },
    include: {
      services: { include: { service: { select: { id: true, name: true } } } },
      _count: { select: { subscriptions: { where: { status: { in: ['ACTIVE', 'DEFAULTING'] } } } } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(plans);
});

// POST /plans — criar plano
subscriptionRouter.post('/plans', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const schema = z.object({
    name:         z.string().min(2),
    price:        z.number().positive(),
    billingCycle: z.enum(['monthly', 'weekly']).default('monthly'),
    description:  z.string().optional(),
    isFeatured:   z.boolean().optional(),
    serviceIds:   z.array(z.string()).min(1, 'Selecione ao menos um serviço'),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { serviceIds, ...planData } = parsed.data;
  const plan = await prisma.clientPlan.create({
    data: {
      ...planData,
      barbershopId,
      services: { create: serviceIds.map(id => ({ serviceId: id })) },
    },
    include: {
      services: { include: { service: { select: { id: true, name: true } } } },
      _count: { select: { subscriptions: true } },
    },
  });
  return res.status(201).json(plan);
});

// PUT /plans/:id — editar plano
subscriptionRouter.put('/plans/:id', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const schema = z.object({
    name:         z.string().min(2).optional(),
    price:        z.number().positive().optional(),
    description:  z.string().optional().nullable(),
    isFeatured:   z.boolean().optional(),
    serviceIds:   z.array(z.string()).min(1).optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { serviceIds, ...planData } = parsed.data;

  // Garante que é da barbearia
  const existing = await prisma.clientPlan.findFirst({
    where: { id: req.params.id, barbershopId },
  });
  if (!existing) return res.status(404).json({ error: 'Plano não encontrado' });

  const plan = await prisma.clientPlan.update({
    where: { id: req.params.id },
    data: {
      ...planData,
      ...(serviceIds ? {
        services: {
          deleteMany: {},
          create: serviceIds.map(id => ({ serviceId: id })),
        },
      } : {}),
    },
    include: {
      services: { include: { service: { select: { id: true, name: true } } } },
      _count: { select: { subscriptions: true } },
    },
  });
  return res.json(plan);
});

// PATCH /plans/:id/toggle — ativar/desativar
subscriptionRouter.patch('/plans/:id/toggle', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const existing = await prisma.clientPlan.findFirst({
    where: { id: req.params.id, barbershopId },
  });
  if (!existing) return res.status(404).json({ error: 'Plano não encontrado' });

  const plan = await prisma.clientPlan.update({
    where: { id: req.params.id },
    data: { isActive: !existing.isActive },
    include: {
      services: { include: { service: { select: { id: true, name: true } } } },
      _count: { select: { subscriptions: true } },
    },
  });
  return res.json(plan);
});

// ─── RELATÓRIOS — deve vir ANTES de /:id para não ser capturado ───────────────

subscriptionRouter.get('/reports', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [allSubs, plans] = await Promise.all([
    prisma.clientSubscription.findMany({
      where: { barbershopId },
      include: { clientPlan: { select: { name: true, price: true } } },
    }),
    prisma.clientPlan.findMany({
      where: { barbershopId },
      include: {
        _count: { select: { subscriptions: { where: { status: { in: ['ACTIVE', 'DEFAULTING'] } } } } },
      },
    }),
  ]);

  const active     = allSubs.filter(s => s.status === 'ACTIVE' || s.status === 'CANCELING');
  const defaulting = allSubs.filter(s => s.status === 'DEFAULTING');
  const canceled   = allSubs.filter(s =>
    (s.status === 'CANCELED' || s.status === 'CANCELING') &&
    s.canceledAt &&
    s.canceledAt >= startOfMonth &&
    s.canceledAt <= endOfMonth,
  );

  const mrr = active.reduce((sum, s) => sum + Number(s.clientPlan.price), 0);

  // Receita por mês — últimos 6 meses
  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
    const revenue = allSubs
      .filter(s => s.lastPaymentAt &&
        s.lastPaymentAt >= new Date(d.getFullYear(), d.getMonth(), 1) &&
        s.lastPaymentAt < new Date(d.getFullYear(), d.getMonth() + 1, 1))
      .reduce((sum, s) => sum + Number(s.clientPlan.price), 0);
    revenueByMonth.push({ month: label, revenue });
  }

  // Top planos por assinantes ativos
  const topPlans = plans
    .map(p => ({
      planId:   p.id,
      planName: p.name,
      count:    p._count.subscriptions,
      mrr:      active.filter(s => s.clientPlanId === p.id)
        .reduce((sum, s) => sum + Number(s.clientPlan.price), 0),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return res.json({
    mrr,
    activeCount: active.length,
    defaultingCount: defaulting.length,
    canceledThisMonth: canceled.length,
    revenueByMonth,
    topPlans,
  });
});

// ─── ASSINATURAS ──────────────────────────────────────────────────────────────

// GET /my — assinatura ativa do cliente logado
subscriptionRouter.get('/my', async (req: Request, res: Response) => {
  const clientId    = req.headers['x-user-id'] as string;
  const barbershopId = req.headers['x-barbershop-id'] as string;

  const sub = await prisma.clientSubscription.findFirst({
    where: { clientId, barbershopId, status: { in: ['ACTIVE', 'DEFAULTING', 'CANCELING'] } },
    include: {
      clientPlan: {
        include: { services: { include: { service: { select: { id: true, name: true } } } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(sub ?? null);
});

// GET / — listar assinaturas
subscriptionRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { status } = req.query;

  const subscriptions = await prisma.clientSubscription.findMany({
    where: { barbershopId, ...(status ? { status: status as any } : {}) },
    include: {
      client:     { select: { name: true, email: true, phone: true } },
      clientPlan: { select: { name: true, price: true, billingCycle: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  return res.json(subscriptions);
});

// POST / — assinar cliente em um plano
subscriptionRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const schema = z.object({
    clientId:    z.string(),
    clientPlanId: z.string(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Valida plano e cliente
  const [plan, client] = await Promise.all([
    prisma.clientPlan.findFirst({ where: { id: parsed.data.clientPlanId, barbershopId } }),
    prisma.user.findUnique({ where: { id: parsed.data.clientId }, select: { name: true, email: true } }),
  ]);
  if (!plan)   return res.status(404).json({ error: 'Plano não encontrado' });
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

  const now  = new Date();
  const end  = addMonths(now, plan.billingCycle === 'weekly' ? 0 : 1);
  if (plan.billingCycle === 'weekly') end.setDate(end.getDate() + 7);

  // 1. Cria o registro no banco
  const sub = await prisma.clientSubscription.create({
    data: {
      ...parsed.data,
      barbershopId,
      currentPeriodStart: now,
      currentPeriodEnd:   end,
      nextPaymentAt:      end,
    },
    include: { clientPlan: true, client: { select: { name: true } } },
  });

  // 2. Solicita criação no Asaas (falha silenciosamente se não configurado)
  const asaasResult = await callPaymentService('/payments/internal/subscription', 'POST', {
    barbershopId,
    clientId:    parsed.data.clientId,
    clientName:  client.name,
    clientEmail: client.email,
    planName:    plan.name,
    value:       Number(plan.price),
    billingCycle: plan.billingCycle,
    nextDueDate: toYMD(end),
  });

  // 3. Persiste asaasSubId e paymentLink se retornados
  let finalSub = sub;
  if (asaasResult?.asaasSubId) {
    finalSub = await prisma.clientSubscription.update({
      where: { id: sub.id },
      data: {
        asaasSubId:  asaasResult.asaasSubId,
        paymentLink: asaasResult.paymentLink ?? null,
      },
      include: { clientPlan: true, client: { select: { name: true } } },
    });
  }

  return res.status(201).json(finalSub);
});

// DELETE /:id — cancelar assinatura
// Cancela cobrança no Asaas imediatamente mas mantém acesso até currentPeriodEnd
subscriptionRouter.delete('/:id', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;

  const sub = await prisma.clientSubscription.findFirst({
    where: { id: req.params.id, barbershopId },
  });
  if (!sub) return res.status(404).json({ error: 'Assinatura não encontrada' });

  if (sub.status === 'CANCELED') {
    return res.status(400).json({ error: 'Assinatura já cancelada' });
  }

  // 1. Cancela no Asaas — interrompe novas cobranças imediatamente
  if (sub.asaasSubId) {
    await callPaymentService(
      `/payments/internal/subscription/${sub.asaasSubId}`,
      'DELETE',
    );
  }

  // 2. Marca como CANCELING — acesso continua até currentPeriodEnd
  const updated = await prisma.clientSubscription.update({
    where: { id: req.params.id },
    data: { status: 'CANCELING', canceledAt: new Date() },
    include: {
      clientPlan: {
        include: { services: { include: { service: { select: { id: true, name: true } } } } },
      },
    },
  });
  return res.json(updated);
});
