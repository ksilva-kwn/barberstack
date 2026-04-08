import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      barbershopId?: string;
      userRole?: string;
    }
  }
}

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const userId = req.headers['x-user-id'] as string;
  const barbershopId = req.headers['x-barbershop-id'] as string;

  if (!userId || !barbershopId) {
    return res.status(401).json({ error: 'Não autenticado' });
  }

  req.userId = userId;
  req.barbershopId = barbershopId;
  req.userRole = req.headers['x-user-role'] as string;

  next();
}
