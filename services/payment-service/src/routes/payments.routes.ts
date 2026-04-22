/**
 * Rotas do Payment Service.
 *
 * Segurança: dados de cartão NUNCA trafegam aqui.
 * Apenas tokens Asaas (asaasSubId, paymentLink) são manipulados.
 */

import { Router, Request, Response } from 'express';
import {
  getBarbershopBalance,
  requestPixTransfer,
  getOnboardingUrl,
  activateAsaasSubAccount,
  closeAsaasAccount,
  getAccountStatus,
} from '../services/asaas-account.service';
import { logger } from '@barberstack/logger';


export const paymentsRouter: Router = Router();

// ─── Saúde ───────────────────────────────────────────────────────────────────
paymentsRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', service: 'payment-service' });
});

// ─── Ativar subconta Asaas (chamado pelo usuário dentro do app) ───────────────
paymentsRouter.post('/activate', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const result = await activateAsaasSubAccount(barbershopId);
    return res.json(result);
  } catch (err: any) {
    logger.error(barbershopId, `[activate] ${JSON.stringify(err?.response?.data ?? err.message)}`);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── Link de onboarding Asaas ────────────────────────────────────────────────
paymentsRouter.get('/onboarding-url', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const url = await getOnboardingUrl(barbershopId);
    return res.json({ url });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ─── Saldo da subconta Asaas ─────────────────────────────────────────────────
paymentsRouter.get('/balance', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const balance = await getBarbershopBalance(barbershopId);
    return res.json(balance);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ─── Transferência PIX via CNPJ ──────────────────────────────────────────────
paymentsRouter.post('/transfer', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { value, description } = req.body as { value: number; description?: string };

  if (!value || value <= 0) {
    return res.status(400).json({ error: 'Valor inválido para transferência' });
  }

  try {
    const result = await requestPixTransfer(barbershopId, value, description);
    return res.json(result);
  } catch (err: any) {
    logger.error(barbershopId, `[transfer] ${JSON.stringify(err?.response?.data ?? err.message)}`);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── Status do cadastro Asaas da subconta ────────────────────────────────────
paymentsRouter.get('/account-status', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const status = await getAccountStatus(barbershopId);
    return res.json(status);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});


// ─── [INTERNAL] Fechar subconta Asaas (balance = 0, conta excluída) ──────────
paymentsRouter.delete('/internal/close-account', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const result = await closeAsaasAccount(barbershopId);
    return res.json(result);
  } catch (err: any) {
    logger.error(barbershopId, `[close-account] ${JSON.stringify(err?.response?.data ?? err.message)}`);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

