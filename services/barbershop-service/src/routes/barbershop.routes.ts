import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@barberstack/database';
// import axios from 'axios';

export const barbershopRouter: Router = Router();

const createSchema = z.object({
  name: z.string().min(2),
  document: z.string().min(11),
  phone: z.string().min(10),
  email: z.string().email(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

// Cadastrar barbearia + criar subconta Asaas
barbershopRouter.post('/', async (req: Request, res: Response) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const data = parsed.data;

  // Gera slug único
  const slug = data.name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-') + '-' + Date.now();

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
    status: { notIn: ['CANCELED'] },
  };
  if (professionalId) appointmentsWhere.professionalId = professionalId;

  const [professionals, appointmentsMonth, activeSubscriptions, revenueTotal, barberCommission] = await Promise.all([
    prisma.professional.count({ where: { barbershopId: id, isActive: true } }),
    prisma.appointment.count({ where: appointmentsWhere }),
    prisma.clientSubscription.count({ where: { barbershopId: id, status: 'ACTIVE' } }),
    
    !professionalId ? prisma.financialTransaction.aggregate({
      where: { barbershopId: id, paidAt: { gte: startOfMonth }, type: 'INCOME' },
      _sum: { netAmount: true },
    }) : Promise.resolve(null),

    professionalId ? prisma.commission.aggregate({
      where: { barbershopId: id, professionalId, createdAt: { gte: startOfMonth } },
      _sum: { commissionAmount: true },
    }) : Promise.resolve(null)
  ]);

  const revenueAmount = professionalId 
    ? (barberCommission?._sum.commissionAmount ? Number(barberCommission._sum.commissionAmount) : 0)
    : (revenueTotal?._sum.netAmount ? Number(revenueTotal._sum.netAmount) : 0);

  return res.json({
    professionals,
    appointmentsMonth,
    activeSubscriptions,
    revenueMonth: revenueAmount,
    openCommands: 0,
    defaulting: 0,
  });
});
