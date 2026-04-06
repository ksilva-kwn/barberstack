import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { checkProfessionalQuota } from '../middlewares/quota.middleware';

export const professionalRouter: Router = Router();

// Listar profissionais da barbearia
professionalRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const professionals = await prisma.professional.findMany({
    where: { barbershopId, isActive: true },
    include: { user: { select: { name: true, email: true, phone: true, avatarUrl: true } } },
  });
  return res.json(professionals);
});

// Adicionar profissional — VERIFICA QUOTA ANTES
professionalRouter.post('/', checkProfessionalQuota, async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { userId, nickname, commissionRate } = req.body;

  const professional = await prisma.professional.create({
    data: { barbershopId, userId, nickname, commissionRate: commissionRate ?? 40 },
    include: { user: { select: { name: true, email: true } } },
  });

  return res.status(201).json(professional);
});

// Desativar profissional
professionalRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.professional.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });
  return res.json({ message: 'Profissional desativado' });
});
