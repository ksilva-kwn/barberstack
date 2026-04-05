import { Request, Response, NextFunction } from 'express';
import { prisma, SaasPlan } from '@barberstack/database';

// =============================================================================
// PLANOS E LIMITES
// =============================================================================
const PLAN_LIMITS: Record<SaasPlan, { maxProfessionals: number | null; maxAppointmentsPerMonth: number | null }> = {
  [SaasPlan.BRONZE]: { maxProfessionals: 1, maxAppointmentsPerMonth: 80 },
  [SaasPlan.SILVER]: { maxProfessionals: 4, maxAppointmentsPerMonth: 400 },
  [SaasPlan.GOLD]:   { maxProfessionals: null, maxAppointmentsPerMonth: null }, // ilimitado
};

// =============================================================================
// Verifica se a barbearia pode adicionar mais um profissional
// =============================================================================
export async function checkProfessionalQuota(req: Request, res: Response, next: NextFunction) {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  if (!barbershopId) return res.status(400).json({ error: 'barbershop_id obrigatório' });

  const shop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    include: { _count: { select: { professionals: { where: { isActive: true } } } } },
  });

  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

  const limits = PLAN_LIMITS[shop.saasPlan];

  if (limits.maxProfessionals !== null && shop._count.professionals >= limits.maxProfessionals) {
    return res.status(403).json({
      error: `Limite de profissionais atingido para o plano ${shop.saasPlan}`,
      limit: limits.maxProfessionals,
      current: shop._count.professionals,
      upgrade: 'Faça upgrade do seu plano em barberstack.app/upgrade',
    });
  }

  next();
}

// =============================================================================
// Verifica se a barbearia pode registrar mais um agendamento no mês
// =============================================================================
export async function checkAppointmentQuota(req: Request, res: Response, next: NextFunction) {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  if (!barbershopId) return res.status(400).json({ error: 'barbershop_id obrigatório' });

  const shop = await prisma.barbershop.findUnique({ where: { id: barbershopId } });
  if (!shop) return res.status(404).json({ error: 'Barbearia não encontrada' });

  const limits = PLAN_LIMITS[shop.saasPlan];
  if (limits.maxAppointmentsPerMonth === null) return next(); // GOLD: ilimitado

  // Conta agendamentos do mês atual (exceto cancelados)
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const count = await prisma.appointment.count({
    where: {
      barbershopId,
      scheduledAt: { gte: startOfMonth, lte: endOfMonth },
      status: { notIn: ['CANCELED'] },
    },
  });

  if (count >= limits.maxAppointmentsPerMonth) {
    return res.status(403).json({
      error: `Limite de ${limits.maxAppointmentsPerMonth} cortes/mês atingido para o plano ${shop.saasPlan}`,
      limit: limits.maxAppointmentsPerMonth,
      current: count,
      upgrade: 'Faça upgrade do seu plano em barberstack.app/upgrade',
    });
  }

  next();
}
