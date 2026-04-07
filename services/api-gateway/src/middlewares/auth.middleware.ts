import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
  sub: string;
  barbershopId: string | null;
  role: string;
  email: string;
  type: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    if (payload.type !== 'access') {
      return res.status(401).json({ error: 'Token inválido' });
    }

    req.user = payload;

    // Propaga contexto do tenant para os microserviços downstream
    req.headers['x-user-id'] = payload.sub;
    req.headers['x-barbershop-id'] = payload.barbershopId ?? '';
    req.headers['x-user-role'] = payload.role;

    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
