import { Router, Request, Response } from 'express';
import { prisma, Prisma } from '@barberstack/database';
import { z } from 'zod';

export const financialRouter: Router = Router();

const txSchema = z.object({
  type:         z.enum(['INCOME', 'EXPENSE']),
  title:        z.string().min(1),
  category:     z.string().min(1),
  amount:       z.number().min(0.01),
  description:  z.string().optional(),
  paymentMethod: z.enum(['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH', 'BOLETO']).optional(),
  status:       z.enum(['PAID', 'PENDING']).default('PAID'),
  dueDate:      z.string().optional(),
  paidAt:       z.string().optional(),
});

// ─── Balanço ─────────────────────────────────────────────────────────────────
financialRouter.get('/balance', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { from, to } = req.query as Record<string, string>;

  const now = new Date();
  const dateFrom = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
  const dateTo   = to   ? new Date(to)   : new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  // Receita de comandas pagas no período
  const [aptRevenue, manualTx, balanceByMonth] = await Promise.all([
    prisma.$queryRaw<Array<{ total: number; qty: number }>>(Prisma.sql`
      SELECT
        COALESCE(SUM(a."totalAmount"), 0)::float
          + COALESCE(SUM(ap_sum.prod_total), 0)::float AS total,
        COUNT(a."id")::int AS qty
      FROM "appointments" a
      LEFT JOIN (
        SELECT ap."appointmentId", SUM(ap."quantity" * ap."price")::float AS prod_total
        FROM "appointment_products" ap
        GROUP BY ap."appointmentId"
      ) ap_sum ON ap_sum."appointmentId" = a."id"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${dateFrom}
        AND a."paidAt" <= ${dateTo}
    `),

    prisma.financialTransaction.findMany({
      where: {
        barbershopId,
        appointmentId: null, // apenas manuais
        OR: [
          { status: 'PAID', paidAt: { gte: dateFrom, lte: dateTo } },
          { status: 'PENDING', dueDate: { gte: dateFrom, lte: dateTo } },
        ],
      },
    }),

    // Receita por mês (últimos 6 meses) — comandas
    prisma.$queryRaw<Array<{ month: string; revenue: number; expenses: number }>>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', a."paidAt"), 'Mon/YY') AS month,
        COALESCE(SUM(a."totalAmount"), 0)::float
          + COALESCE(SUM(ap_sum.prod_total), 0)::float AS revenue,
        0::float AS expenses
      FROM "appointments" a
      LEFT JOIN (
        SELECT ap."appointmentId", SUM(ap."quantity" * ap."price")::float AS prod_total
        FROM "appointment_products" ap
        GROUP BY ap."appointmentId"
      ) ap_sum ON ap_sum."appointmentId" = a."id"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
      GROUP BY DATE_TRUNC('month', a."paidAt")
      ORDER BY DATE_TRUNC('month', a."paidAt") ASC
    `),
  ]);

  const comandaRevenue = Number(aptRevenue[0]?.total ?? 0);
  const comandaQty     = Number(aptRevenue[0]?.qty ?? 0);

  const manualIncome   = manualTx.filter(t => t.type === 'INCOME'  && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
  const manualExpense  = manualTx.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
  const pendingIncome  = manualTx.filter(t => t.type === 'INCOME'  && t.status === 'PENDING').reduce((s, t) => s + Number(t.amount), 0);
  const pendingExpense = manualTx.filter(t => t.type === 'EXPENSE' && t.status === 'PENDING').reduce((s, t) => s + Number(t.amount), 0);

  const totalRevenue  = comandaRevenue + manualIncome;
  const totalExpenses = manualExpense;
  const netProfit     = totalRevenue - totalExpenses;

  // Merge manual expenses into monthly chart
  const monthlyMap: Record<string, { month: string; revenue: number; expenses: number }> = {};
  for (const row of balanceByMonth) {
    monthlyMap[row.month] = { month: row.month, revenue: Number(row.revenue), expenses: 0 };
  }
  for (const tx of manualTx.filter(t => t.type === 'EXPENSE' && t.status === 'PAID' && t.paidAt)) {
    const key = tx.paidAt!.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('. ', '/').replace('.', '/');
    const label = tx.paidAt!.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
      .replace(/\. /g, '/').replace(/\./g, '/')
      .split('/').map((p, i) => i === 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p).join('/');
    if (monthlyMap[label]) monthlyMap[label].expenses += Number(tx.amount);
  }

  return res.json({
    period: { from: dateFrom, to: dateTo },
    comandaRevenue,
    comandaQty,
    manualIncome,
    manualExpense,
    pendingIncome,
    pendingExpense,
    totalRevenue,
    totalExpenses,
    netProfit,
    byMonth: Object.values(monthlyMap),
  });
});

// ─── Listar transações manuais ────────────────────────────────────────────────
financialRouter.get('/transactions', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { type, status, from, to } = req.query as Record<string, string>;

  const where: any = { barbershopId, appointmentId: null };
  if (type) where.type = type;
  if (status) where.status = status;
  if (from || to) {
    where.OR = [
      { paidAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } },
      { dueDate: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } },
    ];
  }

  const txs = await prisma.financialTransaction.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { paidAt: 'desc' }, { createdAt: 'desc' }],
  });

  return res.json(txs);
});

// ─── Criar transação manual ───────────────────────────────────────────────────
financialRouter.post('/transactions', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = txSchema.safeParse(req.body);
  if (!parsed.success) {
    const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
    return res.status(400).json({ error: msgs[0] ?? 'Dados inválidos' });
  }

  const { type, title, category, amount, description, paymentMethod, status, dueDate, paidAt } = parsed.data;

  const tx = await prisma.financialTransaction.create({
    data: {
      barbershopId,
      type: type as any,
      title,
      category,
      amount,
      description,
      paymentMethod: paymentMethod as any ?? null,
      status,
      dueDate: dueDate ? new Date(dueDate) : null,
      paidAt: status === 'PAID' ? (paidAt ? new Date(paidAt) : new Date()) : null,
    },
  });

  return res.status(201).json(tx);
});

// ─── Atualizar transação ──────────────────────────────────────────────────────
financialRouter.put('/transactions/:id', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = txSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
    return res.status(400).json({ error: msgs[0] ?? 'Dados inválidos' });
  }

  const { status, paidAt, dueDate, paymentMethod, ...rest } = parsed.data;
  const data: any = { ...rest };
  if (status !== undefined) {
    data.status = status;
    if (status === 'PAID') data.paidAt = paidAt ? new Date(paidAt) : new Date();
    if (status === 'PENDING') data.paidAt = null;
  }
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (paymentMethod !== undefined) data.paymentMethod = paymentMethod ?? null;

  const updated = await prisma.financialTransaction.updateMany({
    where: { id: req.params.id, barbershopId },
    data,
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Transação não encontrada' });

  const tx = await prisma.financialTransaction.findUnique({ where: { id: req.params.id } });
  return res.json(tx);
});

// ─── Excluir transação ────────────────────────────────────────────────────────
financialRouter.delete('/transactions/:id', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  await prisma.financialTransaction.deleteMany({ where: { id: req.params.id, barbershopId } });
  return res.status(204).send();
});

// ─── Relatório dinâmico de comissões (sem gravar no banco) ───────────────────
// Calcula em tempo real os atendimentos pagos no período agrupados por barbeiro.
financialRouter.get('/commissions', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { from, to, professionalId } = req.query as Record<string, string>;

  const dateFrom = from ? new Date(from)               : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const dateTo   = to   ? new Date(to + 'T23:59:59')  : new Date();

  const where: any = {
    barbershopId,
    paymentStatus: 'PAID',
    scheduledAt: { gte: dateFrom, lte: dateTo },
  };
  if (professionalId) where.professionalId = professionalId;

  const appointments = await prisma.appointment.findMany({
    where,
    include: {
      professional: { include: { user: { select: { name: true } } } },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  // Agrupa por barbeiro
  const byPro: Record<string, {
    professionalId: string;
    name: string;
    commissionRate: number;
    appointments: { id: string; scheduledAt: Date; totalAmount: number; commissionAmount: number }[];
    totalServices: number;
    grossAmount: number;
    commissionAmount: number;
  }> = {};

  for (const apt of appointments) {
    const pid  = apt.professionalId;
    const rate = Number(apt.professional.commissionRate);
    const gross = Number(apt.totalAmount);
    const comm  = (gross * rate) / 100;

    if (!byPro[pid]) {
      byPro[pid] = {
        professionalId: pid,
        name: apt.professional.nickname ?? apt.professional.user.name,
        commissionRate: rate,
        appointments: [],
        totalServices: 0,
        grossAmount: 0,
        commissionAmount: 0,
      };
    }
    byPro[pid].appointments.push({ id: apt.id, scheduledAt: apt.scheduledAt, totalAmount: gross, commissionAmount: comm });
    byPro[pid].totalServices++;
    byPro[pid].grossAmount    += gross;
    byPro[pid].commissionAmount += comm;
  }

  return res.json(Object.values(byPro));
});

// ─── Pagamentos mensais de comissão ──────────────────────────────────────────

// Listar pagamentos por ano (todos os meses, todos os barbeiros)
financialRouter.get('/commission-payments', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { year, professionalId } = req.query as Record<string, string>;

  const where: any = { barbershopId };
  if (year)           where.year           = parseInt(year);
  if (professionalId) where.professionalId = professionalId;

  const payments = await prisma.commissionPayment.findMany({
    where,
    include: {
      professional: { include: { user: { select: { name: true } } } },
    },
    orderBy: [{ year: 'desc' }, { month: 'desc' }, { professionalId: 'asc' }],
  });

  return res.json(payments);
});

// Marcar mês como pago (upsert)
financialRouter.post('/commission-payments', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { professionalId, year, month, totalServices, grossAmount, commissionRate, commissionAmount, notes } = req.body;

  if (!professionalId || !year || !month || commissionAmount === undefined) {
    return res.status(400).json({ error: 'professionalId, year, month e commissionAmount são obrigatórios' });
  }

  const payment = await prisma.commissionPayment.upsert({
    where: { barbershopId_professionalId_year_month: { barbershopId, professionalId, year: parseInt(year), month: parseInt(month) } },
    create: {
      barbershopId,
      professionalId,
      year:             parseInt(year),
      month:            parseInt(month),
      totalServices:    parseInt(totalServices) || 0,
      grossAmount:      parseFloat(grossAmount)      || 0,
      commissionRate:   parseFloat(commissionRate)   || 0,
      commissionAmount: parseFloat(commissionAmount) || 0,
      isPaid:  true,
      paidAt:  new Date(),
      notes:   notes ?? null,
    },
    update: {
      totalServices:    parseInt(totalServices) || 0,
      grossAmount:      parseFloat(grossAmount)      || 0,
      commissionRate:   parseFloat(commissionRate)   || 0,
      commissionAmount: parseFloat(commissionAmount) || 0,
      isPaid:  true,
      paidAt:  new Date(),
      notes:   notes ?? null,
    },
    include: {
      professional: { include: { user: { select: { name: true } } } },
    },
  });

  return res.status(201).json(payment);
});

// Desmarcar mês como pago
financialRouter.delete('/commission-payments/:id', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;

  const updated = await prisma.commissionPayment.updateMany({
    where: { id: req.params.id, barbershopId },
    data: { isPaid: false, paidAt: null },
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Registro não encontrado' });

  return res.status(204).send();
});

// ─── Comissões sobre assinaturas ─────────────────────────────────────────────

// Retorna o relatório de comissões de planos para o período, calculando pelo
// modelo configurado na barbearia (FIXED | PROPORTIONAL | RANKING).
financialRouter.get('/plan-commissions', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { from, to } = req.query as Record<string, string>;

  const dateFrom = from ? new Date(from)              : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const dateTo   = to   ? new Date(to + 'T23:59:59') : new Date();

  const shop = await prisma.barbershop.findUniqueOrThrow({
    where: { id: barbershopId },
    select: { planCommissionModel: true, planCommissionFixedValue: true, planCommissionBarbershopRate: true },
  });

  // Atendimentos vinculados a planos no período (pagos)
  const appointments = await prisma.appointment.findMany({
    where: {
      barbershopId,
      paymentStatus: 'PAID',
      scheduledAt: { gte: dateFrom, lte: dateTo },
      clientSubscriptionId: { not: null },
    },
    include: {
      professional: { include: { user: { select: { name: true } } } },
      clientSubscription: { include: { clientPlan: { select: { price: true } } } },
    },
  });

  // Receita total de assinaturas no período (pagamentos recebidos)
  const paidSubs = await prisma.clientSubscription.findMany({
    where: {
      barbershopId,
      status: { in: ['ACTIVE', 'DEFAULTING'] },
      lastPaymentAt: { gte: dateFrom, lte: dateTo },
    },
    include: { clientPlan: { select: { price: true } } },
  });
  const totalRevenue = paidSubs.reduce((s, sub) => s + Number(sub.clientPlan.price), 0);
  const barbershopRate = Number(shop.planCommissionBarbershopRate ?? 0);
  const distributableRevenue = totalRevenue * (1 - barbershopRate / 100);
  const barbershopRetention = totalRevenue - distributableRevenue;

  // Agrupa atendimentos por barbeiro
  const byPro: Record<string, {
    professionalId: string;
    name: string;
    totalSubscriptionServices: number;
    commissionAmount: number;
  }> = {};

  for (const apt of appointments) {
    const pid = apt.professionalId;
    if (!byPro[pid]) {
      byPro[pid] = {
        professionalId: pid,
        name: apt.professional.nickname ?? apt.professional.user.name,
        totalSubscriptionServices: 0,
        commissionAmount: 0,
      };
    }
    byPro[pid].totalSubscriptionServices++;
  }

  const pros = Object.values(byPro);
  const totalApts = pros.reduce((s, p) => s + p.totalSubscriptionServices, 0);
  const model = shop.planCommissionModel;

  if (model === 'FIXED') {
    const fixedValue = Number(shop.planCommissionFixedValue ?? 0);
    for (const p of pros) {
      p.commissionAmount = p.totalSubscriptionServices * fixedValue;
    }
  } else if (model === 'PROPORTIONAL') {
    for (const p of pros) {
      p.commissionAmount = totalApts > 0 ? (p.totalSubscriptionServices / totalApts) * distributableRevenue : 0;
    }
  } else if (model === 'RANKING') {
    pros.sort((a, b) => b.totalSubscriptionServices - a.totalSubscriptionServices);
    const weights = pros.map((_, i) => i === 0 ? 3 : i === 1 ? 2 : 1);
    const totalWeight = weights.reduce((s, w) => s + w, 0);
    for (let i = 0; i < pros.length; i++) {
      pros[i].commissionAmount = totalWeight > 0 ? (weights[i] / totalWeight) * distributableRevenue : 0;
    }
  }

  return res.json({
    model,
    barbershopRate,
    totalRevenue,
    barbershopRetention,
    distributableRevenue,
    totalSubscriptionServices: totalApts,
    professionals: pros,
  });
});

// Configuração do modelo de comissão de planos
financialRouter.get('/plan-commission-config', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const shop = await prisma.barbershop.findUniqueOrThrow({
    where: { id: barbershopId },
    select: { planCommissionModel: true, planCommissionFixedValue: true, planCommissionBarbershopRate: true },
  });
  return res.json({
    model: shop.planCommissionModel,
    fixedValue: shop.planCommissionFixedValue ? Number(shop.planCommissionFixedValue) : null,
    barbershopRate: Number(shop.planCommissionBarbershopRate ?? 0),
  });
});

financialRouter.patch('/plan-commission-config', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { model, fixedValue, barbershopRate } = req.body as { model: string; fixedValue?: number; barbershopRate?: number };

  const allowed = ['FIXED', 'PROPORTIONAL', 'RANKING'];
  if (!allowed.includes(model)) {
    return res.status(400).json({ error: 'Modelo inválido. Use FIXED, PROPORTIONAL ou RANKING.' });
  }
  if (model === 'FIXED' && (!fixedValue || fixedValue <= 0)) {
    return res.status(400).json({ error: 'Informe o valor fixo por atendimento.' });
  }
  if (barbershopRate !== undefined && (barbershopRate < 0 || barbershopRate > 100)) {
    return res.status(400).json({ error: 'Taxa da barbearia deve ser entre 0 e 100.' });
  }

  const shop = await prisma.barbershop.update({
    where: { id: barbershopId },
    data: {
      planCommissionModel:           model,
      planCommissionFixedValue:      model === 'FIXED' ? fixedValue : null,
      planCommissionBarbershopRate:  barbershopRate ?? 0,
    },
    select: { planCommissionModel: true, planCommissionFixedValue: true, planCommissionBarbershopRate: true },
  });

  return res.json({
    model: shop.planCommissionModel,
    fixedValue: shop.planCommissionFixedValue ? Number(shop.planCommissionFixedValue) : null,
    barbershopRate: Number(shop.planCommissionBarbershopRate ?? 0),
  });
});

// Listar pagamentos de comissão de planos por ano
financialRouter.get('/plan-commission-payments', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { year, professionalId } = req.query as Record<string, string>;

  const where: any = { barbershopId };
  if (year)           where.year           = parseInt(year);
  if (professionalId) where.professionalId = professionalId;

  const payments = await prisma.planCommissionPayment.findMany({
    where,
    include: { professional: { include: { user: { select: { name: true } } } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  return res.json(payments);
});

// Marcar mês de comissão de plano como pago
financialRouter.post('/plan-commission-payments', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { professionalId, year, month, model, totalSubscriptionServices, subscriptionRevenue, commissionAmount, notes } = req.body;

  if (!professionalId || !year || !month || commissionAmount === undefined) {
    return res.status(400).json({ error: 'professionalId, year, month e commissionAmount são obrigatórios' });
  }

  const payment = await prisma.planCommissionPayment.upsert({
    where: { barbershopId_professionalId_year_month: { barbershopId, professionalId, year: +year, month: +month } },
    create: {
      barbershopId, professionalId,
      year: +year, month: +month,
      model: model ?? 'PROPORTIONAL',
      totalSubscriptionServices: +totalSubscriptionServices || 0,
      subscriptionRevenue:       +subscriptionRevenue      || 0,
      commissionAmount:          +commissionAmount,
      isPaid: true, paidAt: new Date(),
      notes: notes ?? null,
    },
    update: {
      model: model ?? 'PROPORTIONAL',
      totalSubscriptionServices: +totalSubscriptionServices || 0,
      subscriptionRevenue:       +subscriptionRevenue      || 0,
      commissionAmount:          +commissionAmount,
      isPaid: true, paidAt: new Date(),
      notes: notes ?? null,
    },
    include: { professional: { include: { user: { select: { name: true } } } } },
  });

  return res.status(201).json(payment);
});

// Desmarcar pagamento de comissão de plano
financialRouter.delete('/plan-commission-payments/:id', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const updated = await prisma.planCommissionPayment.updateMany({
    where: { id: req.params.id, barbershopId },
    data: { isPaid: false, paidAt: null },
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Registro não encontrado' });
  return res.status(204).send();
});

// ─── Relatório financeiro ─────────────────────────────────────────────────────
financialRouter.get('/report', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { from, to } = req.query as Record<string, string>;

  const now = new Date();
  const dateFrom = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const dateTo   = to   ? new Date(to)   : now;

  const [byMethod, byProfessional, byService, topClients, monthlyRevenue] = await Promise.all([
    // Por forma de pagamento
    prisma.$queryRaw<Array<{ method: string; total: number; qty: number }>>(Prisma.sql`
      SELECT
        COALESCE(a."paymentMethod"::text, 'Não informado') AS method,
        SUM(a."totalAmount" + COALESCE(ap_sum.prod_total, 0))::float AS total,
        COUNT(*)::int AS qty
      FROM "appointments" a
      LEFT JOIN (
        SELECT ap."appointmentId", SUM(ap."quantity" * ap."price")::float AS prod_total
        FROM "appointment_products" ap GROUP BY ap."appointmentId"
      ) ap_sum ON ap_sum."appointmentId" = a."id"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${dateFrom} AND a."paidAt" <= ${dateTo}
      GROUP BY a."paymentMethod"
      ORDER BY total DESC
    `),

    // Por barbeiro
    prisma.$queryRaw<Array<{ professionalId: string; name: string; total: number; qty: number }>>(Prisma.sql`
      SELECT
        pr."id" AS "professionalId",
        COALESCE(pr."nickname", u."name") AS name,
        SUM(a."totalAmount" + COALESCE(ap_sum.prod_total, 0))::float AS total,
        COUNT(a."id")::int AS qty
      FROM "appointments" a
      JOIN "professionals" pr ON pr."id" = a."professionalId"
      JOIN "users" u ON u."id" = pr."userId"
      LEFT JOIN (
        SELECT ap."appointmentId", SUM(ap."quantity" * ap."price")::float AS prod_total
        FROM "appointment_products" ap GROUP BY ap."appointmentId"
      ) ap_sum ON ap_sum."appointmentId" = a."id"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${dateFrom} AND a."paidAt" <= ${dateTo}
      GROUP BY pr."id", pr."nickname", u."name"
      ORDER BY total DESC
    `),

    // Por serviço
    prisma.$queryRaw<Array<{ serviceName: string; total: number; qty: number }>>(Prisma.sql`
      SELECT
        s."name" AS "serviceName",
        SUM(aps."price")::float AS total,
        COUNT(*)::int AS qty
      FROM "appointment_services" aps
      JOIN "services" s ON s."id" = aps."serviceId"
      JOIN "appointments" a ON a."id" = aps."appointmentId"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${dateFrom} AND a."paidAt" <= ${dateTo}
      GROUP BY s."name"
      ORDER BY total DESC
      LIMIT 10
    `),

    // Top clientes por receita
    prisma.$queryRaw<Array<{ clientName: string; total: number; qty: number }>>(Prisma.sql`
      SELECT
        COALESCE(u."name", a."clientName", 'Anônimo') AS "clientName",
        SUM(a."totalAmount" + COALESCE(ap_sum.prod_total, 0))::float AS total,
        COUNT(a."id")::int AS qty
      FROM "appointments" a
      LEFT JOIN "users" u ON u."id" = a."clientId"
      LEFT JOIN (
        SELECT ap."appointmentId", SUM(ap."quantity" * ap."price")::float AS prod_total
        FROM "appointment_products" ap GROUP BY ap."appointmentId"
      ) ap_sum ON ap_sum."appointmentId" = a."id"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${dateFrom} AND a."paidAt" <= ${dateTo}
      GROUP BY u."name", a."clientName"
      ORDER BY total DESC
      LIMIT 10
    `),

    // Receita mensal
    prisma.$queryRaw<Array<{ month: string; revenue: number; qty: number }>>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', a."paidAt"), 'Mon/YY') AS month,
        SUM(a."totalAmount" + COALESCE(ap_sum.prod_total, 0))::float AS revenue,
        COUNT(a."id")::int AS qty
      FROM "appointments" a
      LEFT JOIN (
        SELECT ap."appointmentId", SUM(ap."quantity" * ap."price")::float AS prod_total
        FROM "appointment_products" ap GROUP BY ap."appointmentId"
      ) ap_sum ON ap_sum."appointmentId" = a."id"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${dateFrom} AND a."paidAt" <= ${dateTo}
      GROUP BY DATE_TRUNC('month', a."paidAt")
      ORDER BY DATE_TRUNC('month', a."paidAt") ASC
    `),
  ]);

  const totalRevenue  = (monthlyRevenue as any[]).reduce((s, m) => s + Number(m.revenue), 0);
  const totalQty      = (monthlyRevenue as any[]).reduce((s, m) => s + Number(m.qty), 0);
  const ticketMedio   = totalQty > 0 ? totalRevenue / totalQty : 0;

  return res.json({ byMethod, byProfessional, byService, topClients, monthlyRevenue, totalRevenue, totalQty, ticketMedio });
});
