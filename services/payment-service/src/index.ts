import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { paymentsRouter } from './routes/payments.routes';
import { webhookRouter } from './routes/webhook.routes';
import { requireTenant } from './middlewares/tenant.middleware';
import { createAsaasSubAccount } from './services/asaas-account.service';

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
    console.error('[payment/internal/subaccount] Erro Asaas:', err?.response?.data ?? err.message);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── Rotas protegidas ────────────────────────────────────────────────────────
app.use(requireTenant);
app.use('/payments', paymentsRouter);

app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
});
