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
