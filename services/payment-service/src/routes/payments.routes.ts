import { Router, Request, Response } from 'express';
// import { createAsaasSubAccount, getBarbershopBalance, requestWithdrawal } from '../services/asaas-account.service';

export const paymentsRouter: Router = Router();

// ─── Rotas Asaas desabilitadas temporariamente (integração pendente) ──────────

// paymentsRouter.post('/subaccount', async (req: Request, res: Response) => {
//   try {
//     const result = await createAsaasSubAccount(req.body);
//     return res.status(201).json(result);
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// });

// paymentsRouter.get('/balance/:barbershopId', async (req: Request, res: Response) => {
//   try {
//     const balance = await getBarbershopBalance(req.params.barbershopId);
//     return res.json(balance);
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// });

// paymentsRouter.post('/withdraw', async (req: Request, res: Response) => {
//   try {
//     const { barbershopId, amount, bankAccountId } = req.body;
//     const result = await requestWithdrawal(barbershopId, amount, bankAccountId);
//     return res.json(result);
//   } catch (err: any) {
//     return res.status(500).json({ error: err.message });
//   }
// });

paymentsRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', asaas: 'disabled' });
});
