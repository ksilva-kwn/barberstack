import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@barberstack/database';
// import axios from 'axios';

export const barbershopRouter = Router();

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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [professionals, appointmentsMonth, activeSubscriptions, revenue] = await Promise.all([
    prisma.professional.count({ where: { barbershopId: id, isActive: true } }),
    prisma.appointment.count({
      where: { barbershopId: id, scheduledAt: { gte: startOfMonth }, status: { notIn: ['CANCELED'] } },
    }),
    prisma.clientSubscription.count({ where: { barbershopId: id, status: 'ACTIVE' } }),
    prisma.financialTransaction.aggregate({
      where: { barbershopId: id, paidAt: { gte: startOfMonth }, type: 'INCOME' },
      _sum: { netAmount: true },
    }),
  ]);

  return res.json({
    professionals,
    appointmentsThisMonth: appointmentsMonth,
    activeSubscriptions,
    revenueThisMonth: revenue._sum.netAmount ?? 0,
  });
});
