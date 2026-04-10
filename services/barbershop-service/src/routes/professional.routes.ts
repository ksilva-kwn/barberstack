import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { checkProfessionalQuota } from '../middlewares/quota.middleware';

export const professionalRouter: Router = Router();

// Listar profissionais da barbearia
professionalRouter.get('/', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { branchId } = req.query;
  const where: any = { barbershopId, isActive: true };
  if (branchId) where.branchId = branchId as string;

  const professionals = await prisma.professional.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
      professionalServices: { include: { service: true } },
      branch: { select: { id: true, name: true } },
    },
  });
  return res.json(professionals);
});

// Adicionar profissional — VERIFICA QUOTA ANTES
professionalRouter.post('/', checkProfessionalQuota, async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { userId, nickname, commissionRate, branchId } = req.body;

  const professional = await prisma.professional.create({
    data: { barbershopId, userId, nickname, commissionRate: commissionRate ?? 40, branchId: branchId || null },
    include: { user: { select: { name: true, email: true } }, branch: { select: { id: true, name: true } } },
  });

  return res.status(201).json(professional);
});

// Atualizar profissional (nickname, commissionRate, branchId)
professionalRouter.put('/:id', async (req: Request, res: Response) => {
  const { nickname, commissionRate, branchId } = req.body;
  const professional = await prisma.professional.update({
    where: { id: req.params.id },
    data: {
      ...(nickname !== undefined && { nickname }),
      ...(commissionRate !== undefined && { commissionRate }),
      ...(branchId !== undefined && { branchId: branchId || null }),
    },
    include: { user: { select: { name: true, email: true } }, branch: { select: { id: true, name: true } } },
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

// Listar folgas do profissional
professionalRouter.get('/:id/day-offs', async (req: Request, res: Response) => {
  const records = await prisma.professionalDayOff.findMany({
    where: { professionalId: req.params.id },
    orderBy: { date: 'asc' },
  });
  return res.json(records);
});

// Adicionar folga
professionalRouter.post('/:id/day-offs', async (req: Request, res: Response) => {
  const { date, reason, startTime, endTime } = req.body;
  if (!date) return res.status(400).json({ error: 'date obrigatório (yyyy-MM-dd)' });

  const record = await prisma.professionalDayOff.upsert({
    where: { professionalId_date: { professionalId: req.params.id, date } },
    create: { professionalId: req.params.id, date, reason, startTime: startTime || null, endTime: endTime || null },
    update: { reason, startTime: startTime || null, endTime: endTime || null },
  });
  return res.status(201).json(record);
});

// Remover folga
professionalRouter.delete('/:id/day-offs/:dayOffId', async (req: Request, res: Response) => {
  await prisma.professionalDayOff.deleteMany({
    where: { id: req.params.dayOffId, professionalId: req.params.id },
  });
  return res.status(204).send();
});

// ── Bloqueios recorrentes ─────────────────────────────────────────────────────

// Listar
professionalRouter.get('/:id/recurring-blocks', async (req: Request, res: Response) => {
  const records = await prisma.professionalRecurringBlock.findMany({
    where: { professionalId: req.params.id, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });
  return res.json(records);
});

// Adicionar
professionalRouter.post('/:id/recurring-blocks', async (req: Request, res: Response) => {
  const { dayOfWeek, startTime, endTime, reason } = req.body;
  if (!startTime || !endTime) return res.status(400).json({ error: 'startTime e endTime obrigatórios' });

  const record = await prisma.professionalRecurringBlock.create({
    data: {
      professionalId: req.params.id,
      dayOfWeek: dayOfWeek != null ? Number(dayOfWeek) : null,
      startTime,
      endTime,
      reason: reason || null,
    },
  });
  return res.status(201).json(record);
});

// Remover
professionalRouter.delete('/:id/recurring-blocks/:blockId', async (req: Request, res: Response) => {
  await prisma.professionalRecurringBlock.deleteMany({
    where: { id: req.params.blockId, professionalId: req.params.id },
  });
  return res.status(204).send();
});
