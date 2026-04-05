import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { z } from 'zod';

export const serviceRouter = Router();

const serviceSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  durationMins: z.number().int().positive(),
  description: z.string().optional(),
});

serviceRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const services = await prisma.service.findMany({ where: { barbershopId, isActive: true } });
  return res.json(services);
});

serviceRouter.post('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const parsed = serviceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const service = await prisma.service.create({ data: { ...parsed.data, barbershopId } });
  return res.status(201).json(service);
});

serviceRouter.put('/:id', async (req: Request, res: Response) => {
  const parsed = serviceSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const service = await prisma.service.update({ where: { id: req.params.id }, data: parsed.data });
  return res.json(service);
});

serviceRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.service.update({ where: { id: req.params.id }, data: { isActive: false } });
  return res.json({ message: 'Serviço desativado' });
});
