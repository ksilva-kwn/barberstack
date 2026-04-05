import { Router, Request, Response } from 'express';
import { createAsaasSubAccount, getBarbershopBalance, requestWithdrawal } from '../services/asaas-account.service';

export const paymentsRouter = Router();

// Criar subconta Asaas para barbearia (chamado pelo barbershop-service no cadastro)
paymentsRouter.post('/subaccount', async (req: Request, res: Response) => {
  try {
    const result = await createAsaasSubAccount(req.body);
    return res.status(201).json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Consultar saldo da barbearia
paymentsRouter.get('/balance/:barbershopId', async (req: Request, res: Response) => {
  try {
    const balance = await getBarbershopBalance(req.params.barbershopId);
    return res.json(balance);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Solicitar saque
paymentsRouter.post('/withdraw', async (req: Request, res: Response) => {
  try {
    const { barbershopId, amount, bankAccountId } = req.body;
    const result = await requestWithdrawal(barbershopId, amount, bankAccountId);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
