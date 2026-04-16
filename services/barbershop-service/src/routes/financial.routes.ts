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

// ─── Comissões ────────────────────────────────────────────────────────────────
financialRouter.get('/commissions', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { from, to, professionalId, isPaid } = req.query as Record<string, string>;

  const where: any = { barbershopId };
  if (professionalId) where.professionalId = professionalId;
  if (isPaid !== undefined) where.isPaid = isPaid === 'true';
  if (from || to) {
    where.appointment = {
      scheduledAt: {
        ...(from ? { gte: new Date(from) }              : {}),
        ...(to   ? { lte: new Date(to + 'T23:59:59') } : {}),
      },
    };
  }

  const commissions = await prisma.commission.findMany({
    where,
    include: {
      professional: { include: { user: { select: { name: true } } } },
      appointment:  { select: { scheduledAt: true, totalAmount: true, paidAt: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(commissions);
});

// Gerar comissões para comandas pagas sem comissão ainda
financialRouter.post('/commissions/generate', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { from, to } = req.body as { from?: string; to?: string };

  const dateFrom = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const dateTo   = to   ? new Date(to + 'T23:59:59') : new Date();

  // Comandas pagas sem comissão ainda — filtra por scheduledAt (data do serviço)
  const appointments = await prisma.appointment.findMany({
    where: {
      barbershopId,
      paymentStatus: 'PAID',
      scheduledAt: { gte: dateFrom, lte: dateTo },
      commission: null, // sem comissão gerada
    },
    include: {
      professional: true,
      appointmentProducts: true,
    },
  });

  let generated = 0;
  for (const apt of appointments) {
    const rate = Number(apt.professional.commissionRate);
    if (rate <= 0) continue;

    const gross = Number(apt.totalAmount); // apenas serviços — produtos são da barbearia
    const commissionAmount = (gross * rate) / 100;

    await prisma.commission.create({
      data: {
        barbershopId,
        professionalId: apt.professionalId,
        appointmentId:  apt.id,
        grossAmount:     gross,
        commissionRate:  rate,
        commissionAmount,
      },
    });
    generated++;
  }

  return res.json({ generated });
});

// Marcar comissão como paga
financialRouter.patch('/commissions/:id/pay', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;

  const updated = await prisma.commission.updateMany({
    where: { id: req.params.id, barbershopId },
    data: { isPaid: true, paidAt: new Date() },
  });
  if (updated.count === 0) return res.status(404).json({ error: 'Comissão não encontrada' });

  const commission = await prisma.commission.findUnique({ where: { id: req.params.id } });
  return res.json(commission);
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
