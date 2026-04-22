import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { paymentsRouter } from './routes/payments.routes';
import { webhookRouter } from './routes/webhook.routes';
import { requireTenant } from './middlewares/tenant.middleware';
import { createAsaasSubAccount } from './services/asaas-account.service';
import {
  getBarbershopApiKey,
  createOrGetAsaasCustomer,
  createAsaasSubscription,
  cancelAsaasSubscription,
} from './services/asaas-subscription.service';
import { logger } from '@barberstack/logger';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

// ─── Webhook Asaas — PÚBLICO (antes do requireTenant) ───────────────────────
app.use('/payments/webhook', webhookRouter);

// ─── Subconta — INTERNAL (service-to-service, sem tenant header) ─────────────
// Chamado pelo auth-service após criar uma nova barbearia.
app.post('/payments/internal/subaccount', async (req: Request, res: Response) => {
  const { barbershopId, name, email, cpfCnpj, phone, address, city, state, postalCode, companyType, incomeValue } = req.body as {
    barbershopId: string; name: string; email: string; cpfCnpj: string;
    phone: string; address?: string; city?: string; state?: string; postalCode?: string; companyType?: string; incomeValue?: number;
  };

  if (!barbershopId || !name || !email || !cpfCnpj || !phone) {
    return res.status(400).json({ error: 'Campos obrigatórios: barbershopId, name, email, cpfCnpj, phone' });
  }

  try {
    const result = await createAsaasSubAccount({ barbershopId, name, email, cpfCnpj, phone, address, city, state, postalCode, companyType, incomeValue });
    return res.status(201).json(result);
  } catch (err: any) {
    logger.error(barbershopId, `[subaccount] ${JSON.stringify(err?.response?.data ?? err.message)}`);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── [INTERNAL] Criar assinatura no Asaas (service-to-service, sem tenant) ───
app.post('/payments/internal/subscription', async (req: Request, res: Response) => {
  const { barbershopId, clientId, clientName, clientEmail, planName, value, billingCycle, nextDueDate } = req.body as {
    barbershopId: string; clientId: string; clientName: string; clientEmail: string;
    planName: string; value: number; billingCycle: 'monthly' | 'weekly'; nextDueDate: string;
  };

  const apiKey = await getBarbershopApiKey(barbershopId);
  if (!apiKey) {
    logger.warn(barbershopId, '[subscription] sem API key Asaas — assinatura criada sem vínculo');
    return res.json({ asaasSubId: null, paymentLink: null });
  }

  try {
    const customerId = await createOrGetAsaasCustomer(apiKey, { name: clientName, email: clientEmail }, clientId);
    const result = await createAsaasSubscription(apiKey, customerId, { name: planName, value, billingCycle }, nextDueDate);
    logger.info(barbershopId, `[subscription] criada no Asaas: ${JSON.stringify(result)}`);
    return res.json(result);
  } catch (err: any) {
    logger.error(barbershopId, `[subscription] erro Asaas: ${JSON.stringify(err?.response?.data ?? err.message)}`);
    return res.json({ asaasSubId: null, paymentLink: null });
  }
});

// ─── [INTERNAL] Cancelar assinatura no Asaas (service-to-service, sem tenant) ─
app.delete('/payments/internal/subscription/:asaasSubId', async (req: Request, res: Response) => {
  const { asaasSubId } = req.params;
  const { barbershopId } = req.body as { barbershopId?: string };

  const apiKey = barbershopId ? await getBarbershopApiKey(barbershopId) : null;
  if (!apiKey) return res.json({ ok: true });

  try {
    await cancelAsaasSubscription(apiKey, asaasSubId);
    return res.json({ ok: true });
  } catch (err: any) {
    logger.error(barbershopId ?? 'payment-service', `[subscription/cancel] ${JSON.stringify(err?.response?.data ?? err.message)}`);
    return res.json({ ok: true });
  }
});

// ─── Rotas protegidas ────────────────────────────────────────────────────────
app.use(requireTenant);
app.use('/payments', paymentsRouter);

app.listen(PORT, () => {
  logger.info('payment-service', `💳 Payment Service running on port ${PORT}`);
});
