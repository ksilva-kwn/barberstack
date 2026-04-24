import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma, Prisma } from '@barberstack/database';
// import axios from 'axios';

export const barbershopRouter: Router = Router();

// Gera slug limpo e único (sem timestamp)
async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 50);

  let slug = base;
  let counter = 2;
  while (true) {
    const existing = await prisma.barbershop.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) break;
    slug = `${base}${counter++}`;
  }
  return slug;
}

const createSchema = z.object({
  name: z.string().min(2),
  document: z.string().min(11),
  phone: z.string().min(10),
  email: z.string().email(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

// Cadastrar barbearia
barbershopRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;
  const slug = await generateUniqueSlug(data.name);

  const shop = await prisma.barbershop.create({
    data: { ...data, slug },
  });

  // // Cria subconta no Asaas (fire and forget — não bloqueia o cadastro)
  // axios.post(
  //   `${process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005'}/payments/subaccount`,
  //   {
  //     barbershopId: shop.id,
  //     name: shop.name,
  //     email: shop.email,
  //     cpfCnpj: shop.document,
  //     phone: shop.phone,
  //     address: shop.address,
  //     city: shop.city,
  //     state: shop.state,
  //   },
  // ).catch((err) => console.error('[Asaas] Falha ao criar subconta:', err.message));

  return res.status(201).json(shop);
});

// Buscar barbearia
barbershopRouter.get('/:id', async (req: Request, res: Response) => {
  const shop = await prisma.barbershop.findUnique({
    where: { id: req.params.id },
    include: {
      saasSub: true,
      _count: { select: { professionals: true, appointments: true } },
    },
  });
  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });
  return res.json(shop);
});

// Atualizar configurações do portal (slug, cover, description, logo)
barbershopRouter.put('/:id/portal', async (req: Request, res: Response) => {
  const schema = z.object({
    slug:        z.string().min(3).max(50).regex(/^[a-z0-9]+$/, 'Slug deve conter apenas letras minúsculas e números').optional(),
    coverUrl:    z.string().url().nullable().optional(),
    logoUrl:     z.string().url().nullable().optional(),
    description: z.string().max(500).nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { id } = req.params;
  const data = parsed.data;

  // Verifica unicidade do slug (excluindo a própria barbearia)
  if (data.slug) {
    const slug = await generateUniqueSlug(data.slug, id);
    data.slug = slug;
  }

  const shop = await prisma.barbershop.update({
    where: { id },
    data,
    select: { id: true, name: true, slug: true, logoUrl: true, coverUrl: true, description: true },
  });

  return res.json(shop);
});

// Buscar configurações da barbearia
barbershopRouter.get('/:id/settings', async (req: Request, res: Response) => {
  const shop = await prisma.barbershop.findUnique({
    where: { id: req.params.id },
    select: { id: true, name: true, phone: true, email: true, document: true, address: true, city: true, state: true, zipCode: true, companyType: true, incomeValue: true, asaasAccountId: true },
  });
  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });
  return res.json({ ...shop, asaasActivated: !!shop.asaasAccountId });
});

// Atualizar dados financeiros (faturamento, tipo empresa) — usado no onboarding etapa 2
barbershopRouter.patch('/:id/financial', async (req: Request, res: Response) => {
  const schema = z.object({
    incomeValue: z.number().positive(),
    companyType: z.string().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const shop = await prisma.barbershop.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, incomeValue: true, companyType: true },
  });
  return res.json(shop);
});

// Atualizar dados gerais da barbearia (nome, contato, endereço)
barbershopRouter.put('/:id/settings', async (req: Request, res: Response) => {
  const schema = z.object({
    name:    z.string().min(2).optional(),
    phone:   z.string().min(10).optional(),
    email:   z.string().email().optional(),
    address: z.string().nullable().optional(),
    city:    z.string().nullable().optional(),
    state:   z.string().max(2).nullable().optional(),
    zipCode: z.string().nullable().optional(),
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const shop = await prisma.barbershop.update({
    where: { id: req.params.id },
    data: parsed.data,
    select: { id: true, name: true, phone: true, email: true, address: true, city: true, state: true, zipCode: true, document: true },
  });
  return res.json(shop);
});

// Adicionar foto à galeria
barbershopRouter.post('/:id/photos', async (req: Request, res: Response) => {
  const schema = z.object({
    url:     z.string().url(),
    caption: z.string().max(200).optional(),
    order:   z.number().int().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const photo = await prisma.barbershopPhoto.create({
    data: { barbershopId: req.params.id, ...parsed.data },
    select: { id: true, url: true, caption: true, order: true },
  });
  return res.status(201).json(photo);
});

// Remover foto da galeria
barbershopRouter.delete('/:id/photos/:photoId', async (req: Request, res: Response) => {
  await prisma.barbershopPhoto.deleteMany({
    where: { id: req.params.photoId, barbershopId: req.params.id },
  });
  return res.status(204).send();
});

// ── Horário de Funcionamento ──────────────────────────────────────────────────

const DAYS = 7; // 0=Dom … 6=Sáb
const DEFAULT_OPEN  = '09:00';
const DEFAULT_CLOSE = '18:00';

// Retorna 7 entradas (uma por dia), preenchendo com defaults se não existirem
barbershopRouter.get('/:id/business-hours', async (req: Request, res: Response) => {
  const rows = await prisma.barbershopBusinessHours.findMany({
    where: { barbershopId: req.params.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  const map = Object.fromEntries(rows.map((r: { dayOfWeek: number; id: string; barbershopId: string; isOpen: boolean; openTime: string; closeTime: string }) => [r.dayOfWeek, r]));
  const result = Array.from({ length: DAYS }, (_, dow) => map[dow] ?? {
    id: null, barbershopId: req.params.id, dayOfWeek: dow,
    isOpen: false, openTime: DEFAULT_OPEN, closeTime: DEFAULT_CLOSE,
  });

  return res.json(result);
});

// Salva (upsert) os horários de todos os dias
barbershopRouter.put('/:id/business-hours', async (req: Request, res: Response) => {
  const schema = z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    isOpen:    z.boolean(),
    openTime:  z.string().regex(/^\d{2}:\d{2}$/).optional().default(DEFAULT_OPEN),
    closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional().default(DEFAULT_CLOSE),
  }));

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { id } = req.params;

  await Promise.all(
    parsed.data.map((day: { dayOfWeek: number; isOpen: boolean; openTime: string; closeTime: string }) =>
      prisma.barbershopBusinessHours.upsert({
        where:  { barbershopId_dayOfWeek: { barbershopId: id, dayOfWeek: day.dayOfWeek } },
        create: { barbershopId: id, ...day },
        update: { isOpen: day.isOpen, openTime: day.openTime, closeTime: day.closeTime },
      })
    )
  );

  const updated = await prisma.barbershopBusinessHours.findMany({
    where: { barbershopId: id },
    orderBy: { dayOfWeek: 'asc' },
  });
  return res.json(updated);
});

// ── Filiais ───────────────────────────────────────────────────────────────────

// Listar filiais
barbershopRouter.get('/:id/branches', async (req: Request, res: Response) => {
  let branches = await prisma.barbershopBranch.findMany({
    where: { barbershopId: req.params.id },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  });

  // Auto-seed main branch for accounts created before branch support
  if (branches.length === 0) {
    const shop = await prisma.barbershop.findUnique({ where: { id: req.params.id } });
    if (shop) {
      const main = await prisma.barbershopBranch.create({
        data: {
          barbershopId: shop.id,
          name: shop.name,
          phone: shop.phone,
          email: shop.email,
          address: shop.address ?? null,
          city: shop.city ?? null,
          state: shop.state ?? null,
          zipCode: shop.zipCode ?? null,
          isMain: true,
        },
      });
      branches = [main];
    }
  }

  return res.json(branches);
});

// Criar filial
barbershopRouter.post('/:id/branches', async (req: Request, res: Response) => {
  const schema = z.object({
    name:        z.string().min(2),
    cnpj:        z.string().nullable().optional(),
    email:       z.string().nullable().optional(),
    managerName: z.string().nullable().optional(),
    address:     z.string().nullable().optional(),
    phone:       z.string().nullable().optional(),
    city:        z.string().nullable().optional(),
    state:       z.string().max(2).nullable().optional(),
    zipCode:     z.string().nullable().optional(),
    isMain:      z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  // Se isMain=true, desmarca as outras
  if (parsed.data.isMain) {
    await prisma.barbershopBranch.updateMany({
      where: { barbershopId: req.params.id },
      data: { isMain: false },
    });
  }

  const branch = await prisma.barbershopBranch.create({
    data: { barbershopId: req.params.id, ...parsed.data },
  });
  return res.status(201).json(branch);
});

// Atualizar filial
barbershopRouter.put('/:id/branches/:branchId', async (req: Request, res: Response) => {
  const schema = z.object({
    name:        z.string().min(2).optional(),
    cnpj:        z.string().nullable().optional(),
    email:       z.string().nullable().optional(),
    managerName: z.string().nullable().optional(),
    address:     z.string().nullable().optional(),
    phone:       z.string().nullable().optional(),
    city:        z.string().nullable().optional(),
    state:       z.string().max(2).nullable().optional(),
    zipCode:     z.string().nullable().optional(),
    isMain:      z.boolean().optional(),
    isActive:    z.boolean().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  if (parsed.data.isMain) {
    await prisma.barbershopBranch.updateMany({
      where: { barbershopId: req.params.id, id: { not: req.params.branchId } },
      data: { isMain: false },
    });
  }

  const branch = await prisma.barbershopBranch.update({
    where: { id: req.params.branchId },
    data: parsed.data,
  });
  return res.json(branch);
});

// Excluir filial
barbershopRouter.delete('/:id/branches/:branchId', async (req: Request, res: Response) => {
  // Remove vínculo dos profissionais antes de deletar
  await prisma.professional.updateMany({
    where: { branchId: req.params.branchId },
    data: { branchId: null },
  });
  await prisma.barbershopBranch.delete({ where: { id: req.params.branchId } });
  return res.status(204).send();
});

// Dashboard KPIs
barbershopRouter.get('/:id/kpis', async (req: Request, res: Response) => {
  const { id } = req.params;
  const role     = req.headers['x-user-role'] as string;
  const userId   = req.headers['x-user-id'] as string;
  const { professionalId: filterProId, branchId: filterBranchId } = req.query as Record<string, string>;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let professionalId: string | null = null;
  if (role === 'BARBER') {
    const prof = await prisma.professional.findUnique({ where: { userId } });
    if (prof) professionalId = prof.id;
  }

  // Filtros opcionais do admin (não sobrescrevem o filtro do barber)
  const proFilter   = professionalId ?? filterProId    ?? undefined;
  const branchFilter = filterBranchId ?? undefined;

  const appointmentsWhere: any = {
    barbershopId: id,
    scheduledAt: { gte: startOfMonth },
    status: { in: ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED'] },
  };
  if (proFilter)    appointmentsWhere.professionalId = proFilter;
  if (branchFilter) appointmentsWhere.branchId       = branchFilter;

  const [professionals, appointmentsMonth, activeSubscriptions, comandaRevenue, openCommands, subscriptionRevenue] = await Promise.all([
    prisma.professional.count({ where: { barbershopId: id, isActive: true } }),

    prisma.appointment.count({ where: appointmentsWhere }),

    prisma.clientSubscription.count({ where: { barbershopId: id, status: 'ACTIVE' } }),

    // Receita do mês: comandas pagas (serviços + produtos)
    prisma.appointment.aggregate({
      where: {
        barbershopId: id,
        paymentStatus: 'PAID',
        paidAt: { gte: startOfMonth },
        ...(proFilter    ? { professionalId: proFilter }    : {}),
        ...(branchFilter ? { branchId: branchFilter }       : {}),
      },
      _sum: { totalAmount: true },
    }),

    // Comandas abertas = COMPLETED aguardando pagamento
    prisma.appointment.count({
      where: {
        barbershopId: id,
        paymentStatus: 'PENDING',
        status: 'COMPLETED',
        ...(proFilter    ? { professionalId: proFilter }    : {}),
        ...(branchFilter ? { branchId: branchFilter }       : {}),
      },
    }),

    // Receita de assinaturas: mensalidades pagas no mês corrente
    prisma.clientSubscription.findMany({
      where: {
        barbershopId: id,
        status: { in: ['ACTIVE', 'DEFAULTING'] },
        lastPaymentAt: { gte: startOfMonth },
      },
      include: { clientPlan: { select: { price: true } } },
    }),
  ]);

  const subscriptionRevenueMonth = subscriptionRevenue.reduce((s, sub) => s + Number(sub.clientPlan.price), 0);
  const comandaRevenueMonth = Number(comandaRevenue._sum.totalAmount ?? 0);

  return res.json({
    professionals,
    appointmentsMonth,
    activeSubscriptions,
    revenueMonth: comandaRevenueMonth + subscriptionRevenueMonth,
    comandaRevenue: comandaRevenueMonth,
    subscriptionRevenue: subscriptionRevenueMonth,
    openCommands,
    defaulting: 0,
  });
});

// Dashboard — gráfico de faturamento (últimos N meses, preenche meses sem dados com 0)
barbershopRouter.get('/:id/revenue-chart', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { professionalId, branchId, months: monthsParam } = req.query as Record<string, string>;
  const now    = new Date();
  const nMonths = Math.min(Math.max(parseInt(monthsParam ?? '6') || 6, 1), 12);
  const since  = new Date(now.getFullYear(), now.getMonth() - (nMonths - 1), 1);

  const MONTH_ABR = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const label = (d: Date) => `${MONTH_ABR[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`;

  // Gera todos os meses com revenue=0
  const allMonths: { month: string; revenue: number }[] = [];
  for (let i = nMonths - 1; i >= 0; i--) {
    allMonths.push({ month: label(new Date(now.getFullYear(), now.getMonth() - i, 1)), revenue: 0 });
  }

  // Condições extras de filtro
  const extraConds = [
    professionalId ? Prisma.sql`AND "professionalId" = ${professionalId}` : Prisma.empty,
    branchId       ? Prisma.sql`AND "branchId" = ${branchId}`             : Prisma.empty,
  ];

  const [aptRows, subRows] = await Promise.all([
    prisma.$queryRaw<Array<{ month: string; revenue: number }>>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "paidAt"), 'Mon/YY') AS month,
        SUM("totalAmount")::float                        AS revenue
      FROM appointments
      WHERE "barbershopId" = ${id}
        AND "paymentStatus" = 'PAID'
        AND "paidAt" >= ${since}
        ${Prisma.join(extraConds, ' ')}
      GROUP BY DATE_TRUNC('month', "paidAt")
      ORDER BY DATE_TRUNC('month', "paidAt") ASC
    `),

    prisma.$queryRaw<Array<{ month: string; revenue: number }>>(Prisma.sql`
      SELECT
        TO_CHAR(DATE_TRUNC('month', cs."lastPaymentAt"), 'Mon/YY') AS month,
        SUM(cp.price::float)                                        AS revenue
      FROM client_subscriptions cs
      JOIN client_plans cp ON cs."clientPlanId" = cp.id
      WHERE cs."barbershopId" = ${id}
        AND cs."lastPaymentAt" IS NOT NULL
        AND cs."lastPaymentAt" >= ${since}
      GROUP BY DATE_TRUNC('month', cs."lastPaymentAt")
      ORDER BY DATE_TRUNC('month', cs."lastPaymentAt") ASC
    `),
  ]);

  for (const row of aptRows) {
    const slot = allMonths.find(m => m.month === row.month);
    if (slot) slot.revenue += Number(row.revenue);
  }
  for (const row of subRows) {
    const slot = allMonths.find(m => m.month === row.month);
    if (slot) slot.revenue += Number(row.revenue);
  }

  return res.json(allMonths);
});

// Dashboard — gráfico de origem dos agendamentos
barbershopRouter.get('/:id/origin-chart', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { professionalId, branchId } = req.query as Record<string, string>;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const where: any = { barbershopId: id, scheduledAt: { gte: startOfMonth } };
  if (professionalId) where.professionalId = professionalId;
  if (branchId)       where.branchId       = branchId;

  const rows = await prisma.appointment.groupBy({
    by: ['origin'],
    where,
    _count: { origin: true },
  });

  const ORIGIN_LABEL: Record<string, string> = { APP: 'Online', RECEPTION: 'Recepção' };

  return res.json(
    rows.map((r: { origin: string; _count: { origin: number } }) => ({
      name:  ORIGIN_LABEL[r.origin] ?? r.origin,
      value: r._count.origin,
    }))
  );
});
