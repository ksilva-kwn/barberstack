import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { paymentsRouter } from './routes/payments.routes';
import { webhookRouter } from './routes/webhook.routes';
import { requireTenant } from './middlewares/tenant.middleware';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

// ─── Webhook Asaas — PÚBLICO (antes do requireTenant) ───────────────────────
// Asaas não envia headers de autenticação, então esta rota não pode estar
// protegida pelo middleware de tenant. Registrada antes do requireTenant.
app.use('/payments/webhook', webhookRouter);

// ─── Rotas protegidas ────────────────────────────────────────────────────────
app.use(requireTenant);
app.use('/payments', paymentsRouter);

app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
});
