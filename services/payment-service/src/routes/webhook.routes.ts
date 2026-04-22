/**
 * Webhook Asaas — rota PÚBLICA (sem autenticação).
 * Montada antes do requireTenant no index.ts.
 *
 * Asaas envia eventos quando o status de uma cobrança muda.
 * Apenas o asaasSubId é usado para identificar a assinatura — sem dados de cartão.
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@barberstack/database';
import { logger } from '@barberstack/logger';

export const webhookRouter: Router = Router();

// ── Validação de saque — Asaas chama antes de processar cada transfer ────────
// Asaas espera { "status": "APPROVED" } ou { "status": "REFUSED", "refuseReason": "..." }
webhookRouter.post('/transfer-validation', (req: Request, res: Response) => {
  const token = process.env.ASAAS_TRANSFER_VALIDATION_TOKEN;
  if (token && req.headers['asaas-access-token'] !== token) {
    return res.status(200).json({ status: 'REFUSED', refuseReason: 'Token inválido' });
  }
  return res.status(200).json({ status: 'APPROVED' });
});

webhookRouter.post('/asaas', async (req: Request, res: Response) => {
  // Responde 200 imediatamente para evitar reenvio
  res.sendStatus(200);

  const event = req.body as {
    event: string;
    payment?: { subscription?: string; confirmedDate?: string; invoiceUrl?: string };
    subscription?: { id: string };
  };

  try {
    const type = event.event;

    // ── Pagamento confirmado → ACTIVE ────────────────────────────────────────
    if (type === 'PAYMENT_CONFIRMED' || type === 'PAYMENT_RECEIVED') {
      const subId = event.payment?.subscription;
      if (!subId) return;

      const now = new Date();
      const nextPayment = new Date(now);
      nextPayment.setMonth(nextPayment.getMonth() + 1);

      await prisma.clientSubscription.updateMany({
        where: { asaasSubId: subId },
        data: {
          status: 'ACTIVE',
          lastPaymentAt: now,
          nextPaymentAt: nextPayment,
        },
      });
    }

    // ── Pagamento vencido → DEFAULTING ──────────────────────────────────────
    else if (type === 'PAYMENT_OVERDUE') {
      const subId = event.payment?.subscription;
      if (!subId) return;

      await prisma.clientSubscription.updateMany({
        where: { asaasSubId: subId, status: { not: 'CANCELED' } },
        data: { status: 'DEFAULTING' },
      });
    }

    // ── Assinatura deletada no Asaas → CANCELED ──────────────────────────────
    else if (type === 'SUBSCRIPTION_DELETED') {
      const subId = event.subscription?.id ?? event.payment?.subscription;
      if (!subId) return;

      await prisma.clientSubscription.updateMany({
        where: { asaasSubId: subId },
        data: { status: 'CANCELED', canceledAt: new Date() },
      });
    }

    // ── Primeira cobrança criada → salvar paymentLink ────────────────────────
    else if (type === 'PAYMENT_CREATED') {
      const subId = event.payment?.subscription;
      const link  = event.payment?.invoiceUrl;
      if (!subId || !link) return;

      await prisma.clientSubscription.updateMany({
        where: { asaasSubId: subId, paymentLink: null },
        data: { paymentLink: link },
      });
    }
  } catch (err) {
    logger.error('webhook', `[asaas] erro ao processar evento: ${err}`);
  }
});
