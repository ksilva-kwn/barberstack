import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';

export const publicRouter: Router = Router();

// Busca barbearia pelo slug (sem auth)
publicRouter.get('/:slug', async (req: Request, res: Response) => {
  const shop = await prisma.barbershop.findUnique({
    where: { slug: req.params.slug },
    select: { id: true, name: true, logoUrl: true, coverUrl: true, description: true, city: true, state: true, phone: true, slug: true },
  });
  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });
  return res.json(shop);
});

// Lista profissionais ativos da barbearia
publicRouter.get('/:slug/professionals', async (req: Request, res: Response) => {
  const shop = await prisma.barbershop.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });
  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

  const professionals = await prisma.professional.findMany({
    where: { barbershopId: shop.id, isActive: true },
    include: {
      user: { select: { name: true, avatarUrl: true } },
      professionalServices: {
        include: { service: { select: { id: true, name: true, price: true, durationMins: true, isActive: true } } },
      },
    },
  });
  return res.json(professionals);
});

// Fotos da galeria da barbearia
publicRouter.get('/:slug/photos', async (req: Request, res: Response) => {
  const shop = await prisma.barbershop.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });
  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

  const photos = await prisma.barbershopPhoto.findMany({
    where: { barbershopId: shop.id },
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    select: { id: true, url: true, caption: true, order: true },
  });
  return res.json(photos);
});

// Lista serviços ativos da barbearia
publicRouter.get('/:slug/services', async (req: Request, res: Response) => {
  const shop = await prisma.barbershop.findUnique({
    where: { slug: req.params.slug },
    select: { id: true },
  });
  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

  const services = await prisma.service.findMany({
    where: { barbershopId: shop.id, isActive: true },
    orderBy: { name: 'asc' },
  });
  return res.json(services);
});
