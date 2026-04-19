/**
 * Rotas do Payment Service.
 *
 * Segurança: dados de cartão NUNCA trafegam aqui.
 * Apenas tokens Asaas (asaasSubId, paymentLink) são manipulados.
 */

import { Router, Request, Response } from 'express';
import {
  getBarbershopApiKey,
  createOrGetAsaasCustomer,
  createAsaasSubscription,
  cancelAsaasSubscription,
} from '../services/asaas-subscription.service';
import {
  getBarbershopBalance,
  requestPixTransfer,
  getOnboardingUrl,
} from '../services/asaas-account.service';

export const paymentsRouter: Router = Router();

// ─── Saúde ───────────────────────────────────────────────────────────────────
paymentsRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', service: 'payment-service' });
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
    console.error('[payment/transfer] Erro Asaas:', err?.response?.data ?? err.message);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── [INTERNAL] Criar assinatura no Asaas ────────────────────────────────────
paymentsRouter.post('/internal/subscription', async (req: Request, res: Response) => {
  const {
    barbershopId,
    clientId,
    clientName,
    clientEmail,
    planName,
    value,
    billingCycle,
    nextDueDate,
  } = req.body as {
    barbershopId: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    planName: string;
    value: number;
    billingCycle: 'monthly' | 'weekly';
    nextDueDate: string;
  };

  const apiKey = await getBarbershopApiKey(barbershopId);
  if (!apiKey) {
    return res.json({ asaasSubId: null, paymentLink: null });
  }

  try {
    const customerId = await createOrGetAsaasCustomer(apiKey, {
      name: clientName,
      email: clientEmail,
    }, clientId);

    const result = await createAsaasSubscription(
      apiKey,
      customerId,
      { name: planName, value, billingCycle },
      nextDueDate,
    );

    return res.json(result);
  } catch (err: any) {
    console.error('[payment/internal/subscription] Erro Asaas:', err?.response?.data ?? err.message);
    return res.json({ asaasSubId: null, paymentLink: null });
  }
});

// ─── [INTERNAL] Cancelar assinatura no Asaas ─────────────────────────────────
paymentsRouter.delete('/internal/subscription/:asaasSubId', async (req: Request, res: Response) => {
  const { asaasSubId } = req.params;
  const barbershopId = req.headers['x-barbershop-id'] as string;

  const apiKey = await getBarbershopApiKey(barbershopId);
  if (!apiKey) return res.json({ ok: true });

  try {
    await cancelAsaasSubscription(apiKey, asaasSubId);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('[payment/internal/subscription] Erro ao cancelar no Asaas:', err?.response?.data ?? err.message);
    return res.json({ ok: true });
  }
});
