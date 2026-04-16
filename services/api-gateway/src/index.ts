
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { authMiddleware } from './middlewares/auth.middleware';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// ─── Security & Logging ──────────────────────────────────────────────────────
app.use(helmet());
app.use(morgan('combined'));
const allowedOrigins = process.env.ALLOWED_ORIGINS || '*';
app.use(cors({
  origin: allowedOrigins === '*' ? '*' : allowedOrigins.split(',').map(o => o.trim()),
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Requisições internas (localhost / EC2 → seeds, healthchecks) não sofrem rate limit
    const ip = req.ip || req.socket.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  },
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
  pathRewrite: (path) => `/auth${path}`,
}));

// Rotas públicas do portal do cliente (sem auth)
app.use('/api/public/shop', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: (path) => `/public${path}`,
}));

app.use('/api/public', createProxyMiddleware({
  target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3003',
  changeOrigin: true,
  pathRewrite: (path) => `/public${path}`,
}));

// ─── Protected Routes (com auth) ─────────────────────────────────────────────
app.use(authMiddleware);

app.use('/api/barbershops', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: (path) => `/barbershops${path}`,
}));

app.use('/api/appointments', createProxyMiddleware({
  target: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3003',
  changeOrigin: true,
  pathRewrite: (path) => `/appointments${path}`,
}));

app.use('/api/professionals', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: (path) => `/professionals${path}`,
}));

app.use('/api/clients', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: (path) => `/users${path}`,
}));

app.use('/api/services', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: (path) => `/services${path}`,
}));

app.use('/api/products', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: (path) => `/products${path}`,
}));

app.use('/api/financial', createProxyMiddleware({
  target: process.env.BARBERSHOP_SERVICE_URL || 'http://barbershop-service:3002',
  changeOrigin: true,
  pathRewrite: (path) => `/financial${path}`,
}));

app.use('/api/subscriptions', createProxyMiddleware({
  target: process.env.SUBSCRIPTION_SERVICE_URL || 'http://subscription-service:3004',
  changeOrigin: true,
  pathRewrite: (path) => `/subscriptions${path}`,
}));

app.use('/api/payments', createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3005',
  changeOrigin: true,
  pathRewrite: (path) => `/payments${path}`,
}));

app.use('/api/notifications', createProxyMiddleware({
  target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
  changeOrigin: true,
  pathRewrite: (path) => `/notifications${path}`,
}));

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
});

export default app;
