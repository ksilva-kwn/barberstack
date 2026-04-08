import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { checkProfessionalQuota } from '../middlewares/quota.middleware';

export const professionalRouter: Router = Router();

// Listar profissionais da barbearia
professionalRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const professionals = await prisma.professional.findMany({
    where: { barbershopId, isActive: true },
    include: {
      user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
      professionalServices: { include: { service: true } },
    },
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

// Atualizar profissional (nickname, commissionRate)
professionalRouter.put('/:id', async (req: Request, res: Response) => {
  const { nickname, commissionRate } = req.body;
  const professional = await prisma.professional.update({
    where: { id: req.params.id },
    data: { ...(nickname !== undefined && { nickname }), ...(commissionRate !== undefined && { commissionRate }) },
    include: { user: { select: { name: true, email: true } } },
  });
  return res.json(professional);
});

// Desativar profissional
professionalRouter.delete('/:id', async (req: Request, res: Response) => {
  await prisma.professional.update({ where: { id: req.params.id }, data: { isActive: false } });
  return res.json({ message: 'Profissional desativado' });
});

// Listar serviços do profissional
professionalRouter.get('/:id/services', async (req: Request, res: Response) => {
  const records = await prisma.professionalService.findMany({
    where: { professionalId: req.params.id },
    include: { service: true },
  });
  return res.json(records.map((r) => r.service));
});

// Atribuir serviço ao profissional
professionalRouter.post('/:id/services', async (req: Request, res: Response) => {
  const { serviceId } = req.body;
  if (!serviceId) return res.status(400).json({ error: 'serviceId obrigatório' });

  await prisma.professionalService.upsert({
    where: { professionalId_serviceId: { professionalId: req.params.id, serviceId } },
    create: { professionalId: req.params.id, serviceId },
    update: {},
  });
  return res.status(201).json({ message: 'Serviço atribuído' });
});

// Remover serviço do profissional
professionalRouter.delete('/:id/services/:serviceId', async (req: Request, res: Response) => {
  await prisma.professionalService.deleteMany({
    where: { professionalId: req.params.id, serviceId: req.params.serviceId },
  });
  return res.json({ message: 'Serviço removido' });
});
