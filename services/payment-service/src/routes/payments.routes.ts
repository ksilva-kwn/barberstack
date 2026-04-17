/**
 * Rotas internas do Payment Service.
 * Estas rotas são chamadas service-to-service (subscription-service → payment-service)
 * pela rede interna Docker e NÃO ficam expostas publicamente via API Gateway.
 *
 * Segurança: dados de cartão nunca trafegam aqui.
 * Apenas { asaasSubId, paymentLink } são retornados — tokens Asaas.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import {
  getBarbershopApiKey,
  createOrGetAsaasCustomer,
  createAsaasSubscription,
  cancelAsaasSubscription,
} from '../services/asaas-subscription.service';
import { getBarbershopBalance } from '../services/asaas-account.service';

export const paymentsRouter: Router = Router();

// ─── Saúde ───────────────────────────────────────────────────────────────────
paymentsRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', service: 'payment-service' });
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

// ─── [INTERNAL] Criar assinatura no Asaas ────────────────────────────────────
// Chamado pelo subscription-service após criar o registro no banco.
// Body: { barbershopId, clientId, clientName, clientEmail, planName, value, billingCycle, nextDueDate }
// Retorna: { asaasSubId, paymentLink } ou { asaasSubId: null, paymentLink: null }
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

  // Se a barbearia não tem subconta Asaas, retorna null graciosamente
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
    // Não falha o fluxo — retorna null para que a assinatura seja criada sem Asaas
    return res.json({ asaasSubId: null, paymentLink: null });
  }
});

// ─── [INTERNAL] Cancelar assinatura no Asaas ────────────────────────────────
paymentsRouter.delete('/internal/subscription/:asaasSubId', async (req: Request, res: Response) => {
  const { asaasSubId } = req.params;
  const barbershopId = req.headers['x-barbershop-id'] as string;

  const apiKey = await getBarbershopApiKey(barbershopId);
  if (!apiKey) return res.json({ ok: true }); // sem Asaas — nada a fazer

  try {
    await cancelAsaasSubscription(apiKey, asaasSubId);
    return res.json({ ok: true });
  } catch (err: any) {
    console.error('[payment/internal/subscription] Erro ao cancelar no Asaas:', err?.response?.data ?? err.message);
    return res.json({ ok: true }); // não bloqueia o cancelamento local
  }
});
