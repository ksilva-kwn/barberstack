import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { z } from 'zod';

export const productRouter: Router = Router();

const productSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['ESTOQUE', 'BAR']).default('ESTOQUE'),
  description: z.string().optional(),
  price: z.number().min(0),
  costPrice: z.number().min(0).optional(),
  stock: z.number().int().min(0).default(0),
  minStockAlert: z.number().int().min(0).default(5),
  unit: z.string().default('un'),
  isActive: z.boolean().default(true),
});

// Stats de produtos (relatórios) — deve vir ANTES de /:id
productRouter.get('/stats', async (req: Request, res: Response): Promise<any> => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const type = (req.query.type as string) || undefined;

  const where: any = { barbershopId, isActive: true };
  if (type) where.type = type;

  const now = new Date();

  const [products, soldRows, revenueByMonth] = await Promise.all([
    prisma.product.findMany({ where }),

    // Produtos vendidos via comandas (appointment_products + appointment pago)
    prisma.$queryRaw<Array<{
      productId: string;
      productName: string;
      productType: string;
      unitCost: number;
      unitPrice: number;
      totalQty: number;
      totalRevenue: number;
    }>>`
      SELECT
        p."id"           AS "productId",
        p."name"         AS "productName",
        p."type"         AS "productType",
        COALESCE(p."costPrice", 0)::float AS "unitCost",
        p."price"::float AS "unitPrice",
        SUM(ap."quantity")::int AS "totalQty",
        SUM(ap."quantity" * ap."price")::float AS "totalRevenue"
      FROM "appointment_products" ap
      JOIN "products" p ON p."id" = ap."productId"
      JOIN "appointments" a ON a."id" = ap."appointmentId"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        ${type ? prisma.$queryRaw`AND p."type" = ${type}` : prisma.$queryRaw``}
      GROUP BY p."id", p."name", p."type", p."costPrice", p."price"
      ORDER BY "totalQty" DESC
    `,

    // Receita por mês (últimos 6 meses)
    prisma.$queryRaw<Array<{ month: string; revenue: number; qty: number }>>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', a."paidAt"), 'Mon/YY') AS month,
        SUM(ap."quantity" * ap."price")::float AS revenue,
        SUM(ap."quantity")::int AS qty
      FROM "appointment_products" ap
      JOIN "products" p ON p."id" = ap."productId"
      JOIN "appointments" a ON a."id" = ap."appointmentId"
      WHERE a."barbershopId" = ${barbershopId}
        AND a."paymentStatus" = 'PAID'
        AND a."paidAt" >= ${new Date(now.getFullYear(), now.getMonth() - 5, 1)}
        ${type ? prisma.$queryRaw`AND p."type" = ${type}` : prisma.$queryRaw``}
      GROUP BY DATE_TRUNC('month', a."paidAt")
      ORDER BY DATE_TRUNC('month', a."paidAt") ASC
    `,
  ]);

  // KPIs de estoque
  const totalStockValue = products.reduce((s, p) => s + p.stock * Number(p.price), 0);
  const totalCostValue  = products.reduce((s, p) => s + p.stock * Number(p.costPrice ?? 0), 0);
  const lowStock        = products.filter(p => p.stock <= p.minStockAlert && p.stock > 0);
  const outOfStock      = products.filter(p => p.stock === 0);
  const neverSoldIds    = new Set(soldRows.map((r: any) => r.productId));
  const deadStock       = products.filter(p => !neverSoldIds.has(p.id) && p.stock > 0);

  // Receita total de produtos
  const totalRevenue = (soldRows as any[]).reduce((s: number, r: any) => s + Number(r.totalRevenue), 0);
  const totalQtySold = (soldRows as any[]).reduce((s: number, r: any) => s + Number(r.totalQty), 0);

  // Margem bruta por produto
  const topByMargin = (soldRows as any[])
    .map((r: any) => ({
      ...r,
      margin: (Number(r.unitPrice) - Number(r.unitCost)) * Number(r.totalQty),
      marginPct: Number(r.unitPrice) > 0
        ? ((Number(r.unitPrice) - Number(r.unitCost)) / Number(r.unitPrice)) * 100
        : 0,
    }))
    .sort((a: any, b: any) => b.margin - a.margin)
    .slice(0, 10);

  return res.json({
    totalProducts: products.length,
    totalStockValue,
    totalCostValue,
    potentialProfit: totalStockValue - totalCostValue,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    deadStockCount: deadStock.length,
    deadStock: deadStock.slice(0, 5).map(p => ({ id: p.id, name: p.name, stock: p.stock, unit: p.unit })),
    lowStockProducts: lowStock.slice(0, 5).map(p => ({ id: p.id, name: p.name, stock: p.stock, minStockAlert: p.minStockAlert, unit: p.unit })),
    topSold: (soldRows as any[]).slice(0, 10),
    topByMargin,
    totalRevenue,
    totalQtySold,
    revenueByMonth,
  });
});

// Listar produtos
productRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { type, search } = req.query;

  const where: any = { barbershopId };
  if (type) where.type = type;
  if (search) where.name = { contains: search as string, mode: 'insensitive' };

  const products = await prisma.product.findMany({
    where,
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  });

  return res.json(products);
});

// Criar produto
productRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
    return res.status(400).json({ error: msgs[0] ?? 'Dados inválidos' });
  }

  const product = await prisma.product.create({
    data: { barbershopId, ...parsed.data },
  });

  return res.status(201).json(product);
});

// Atualizar produto
productRouter.put('/:id', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = productSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    const msgs = Object.values(parsed.error.flatten().fieldErrors).flat();
    return res.status(400).json({ error: msgs[0] ?? 'Dados inválidos' });
  }

  const product = await prisma.product.updateMany({
    where: { id: req.params.id, barbershopId },
    data: parsed.data,
  });

  if (product.count === 0) return res.status(404).json({ error: 'Produto não encontrado' });

  const updated = await prisma.product.findUnique({ where: { id: req.params.id } });
  return res.json(updated);
});

// Ajustar estoque manualmente
productRouter.patch('/:id/stock', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { delta } = req.body; // positivo = entrada, negativo = saída

  if (typeof delta !== 'number') {
    return res.status(400).json({ error: 'delta (number) obrigatório' });
  }

  const product = await prisma.product.findFirst({
    where: { id: req.params.id, barbershopId },
  });
  if (!product) return res.status(404).json({ error: 'Produto não encontrado' });

  const newStock = Math.max(0, product.stock + delta);
  const updated = await prisma.product.update({
    where: { id: req.params.id },
    data: { stock: newStock },
  });

  return res.json(updated);
});

// Deletar produto
productRouter.delete('/:id', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  await prisma.product.deleteMany({ where: { id: req.params.id, barbershopId } });
  return res.status(204).send();
});
