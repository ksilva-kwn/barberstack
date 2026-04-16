import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@barberstack/database';
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

// ── Filiais ───────────────────────────────────────────────────────────────────

// Listar filiais
barbershopRouter.get('/:id/branches', async (req: Request, res: Response) => {
  const branches = await prisma.barbershopBranch.findMany({
    where: { barbershopId: req.params.id },
    orderBy: [{ isMain: 'desc' }, { name: 'asc' }],
  });
  return res.json(branches);
});

// Criar filial
barbershopRouter.post('/:id/branches', async (req: Request, res: Response) => {
  const schema = z.object({
    name:    z.string().min(2),
    address: z.string().nullable().optional(),
    phone:   z.string().nullable().optional(),
    city:    z.string().nullable().optional(),
    state:   z.string().max(2).nullable().optional(),
    zipCode: z.string().nullable().optional(),
    isMain:  z.boolean().optional(),
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
    name:     z.string().min(2).optional(),
    address:  z.string().nullable().optional(),
    phone:    z.string().nullable().optional(),
    city:     z.string().nullable().optional(),
    state:    z.string().max(2).nullable().optional(),
    zipCode:  z.string().nullable().optional(),
    isMain:   z.boolean().optional(),
    isActive: z.boolean().optional(),
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
  const role = req.headers['x-user-role'] as string;
  const userId = req.headers['x-user-id'] as string;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  let professionalId: string | null = null;
  if (role === 'BARBER') {
    const prof = await prisma.professional.findUnique({ where: { userId } });
    if (prof) professionalId = prof.id;
  }

  const appointmentsWhere: any = {
    barbershopId: id,
    scheduledAt: { gte: startOfMonth },
    status: { in: ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED'] },
  };
  if (professionalId) appointmentsWhere.professionalId = professionalId;

  const [professionals, appointmentsMonth, activeSubscriptions, revenueTotal, barberCommission] = await Promise.all([
    prisma.professional.count({ where: { barbershopId: id, isActive: true } }),

    // Barber: conta via comissões (mesma fonte da página de Comissões)
    // Admin: conta agendamentos do mês
    professionalId
      ? prisma.commission.count({ where: { barbershopId: id, professionalId, createdAt: { gte: startOfMonth } } })
      : prisma.appointment.count({ where: appointmentsWhere }),

    prisma.clientSubscription.count({ where: { barbershopId: id, status: 'ACTIVE' } }),

    !professionalId ? prisma.financialTransaction.aggregate({
      where: { barbershopId: id, paidAt: { gte: startOfMonth }, type: 'INCOME' },
      _sum: { netAmount: true },
    }) : Promise.resolve(null),

    professionalId ? prisma.commission.aggregate({
      where: { barbershopId: id, professionalId, createdAt: { gte: startOfMonth } },
      _sum: { commissionAmount: true },
    }) : Promise.resolve(null),
  ]);

  // Receita do mês: comandas pagas + transações manuais de receita
  const [comandaRevenue, openCommands] = await Promise.all([
    !professionalId ? prisma.appointment.aggregate({
      where: { barbershopId: id, paymentStatus: 'PAID', paidAt: { gte: startOfMonth } },
      _sum: { totalAmount: true },
    }) : Promise.resolve(null),
    prisma.appointment.count({
      where: { barbershopId: id, paymentStatus: 'PENDING', status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED'] } },
    }),
  ]);

  const revenueAmount = professionalId
    ? (barberCommission?._sum.commissionAmount ? Number(barberCommission._sum.commissionAmount) : 0)
    : (Number(revenueTotal?._sum.netAmount ?? 0) + Number(comandaRevenue?._sum.totalAmount ?? 0));

  return res.json({
    professionals,
    appointmentsMonth,
    activeSubscriptions,
    revenueMonth: revenueAmount,
    openCommands,
    defaulting: 0,
  });
});

// Dashboard — gráfico de faturamento mensal (últimos 6 meses)
barbershopRouter.get('/:id/revenue-chart', async (req: Request, res: Response) => {
  const { id } = req.params;
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const rows = await prisma.$queryRaw<Array<{ month: string; revenue: number }>>`
    SELECT
      TO_CHAR(DATE_TRUNC('month', "paidAt"), 'Mon/YY') AS month,
      SUM("totalAmount")::float                        AS revenue
    FROM appointments
    WHERE "barbershopId" = ${id}
      AND "paymentStatus" = 'PAID'
      AND "paidAt" >= ${sixMonthsAgo}
    GROUP BY DATE_TRUNC('month', "paidAt")
    ORDER BY DATE_TRUNC('month', "paidAt") ASC
  `;

  return res.json((rows as Array<{ month: string; revenue: number }>).map(r => ({ month: r.month, revenue: Number(r.revenue) })));
});

// Dashboard — gráfico de origem dos agendamentos
barbershopRouter.get('/:id/origin-chart', async (req: Request, res: Response) => {
  const { id } = req.params;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const rows = await prisma.appointment.groupBy({
    by: ['origin'],
    where: { barbershopId: id, scheduledAt: { gte: startOfMonth } },
    _count: { origin: true },
  });

  return res.json(rows.map((r: { origin: string; _count: { origin: number } }) => ({ origin: r.origin, count: r._count.origin })));
});
