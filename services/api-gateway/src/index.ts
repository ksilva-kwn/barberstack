import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middlewares/auth.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Logging ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ─── Public Routes (sem auth) ─────────────────────────────────────────────────
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
}));

// ─── Protected Routes (com auth) ─────────────────────────────────────────────
app.use(authMiddleware);

app.use('/api/barbershops', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: { '^/api/barbershops': '/barbershops' },
}));

app.use('/api/appointments', createProxyMiddleware({
  target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3003',
  changeOrigin: true,
  pathRewrite: { '^/api/appointments': '/appointments' },
}));

app.use('/api/subscriptions', createProxyMiddleware({
  target: process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/api/subscriptions': '/subscriptions' },
}));

app.use('/api/payments', createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '/payments' },
}));

app.use('/api/notifications', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '/notifications' },
}));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});

export default app;
