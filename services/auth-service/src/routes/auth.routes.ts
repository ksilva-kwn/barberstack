import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

export const authRouter = Router();
const ctrl = new AuthController();

authRouter.post('/login', ctrl.login);
authRouter.post('/register', ctrl.register);
authRouter.post('/refresh', ctrl.refreshToken);
authRouter.post('/logout', ctrl.logout);
authRouter.get('/me', ctrl.me);
