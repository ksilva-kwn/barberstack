
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { subscriptionRouter } from './routes/subscription.routes';
import { requireTenant } from './middlewares/tenant.middleware';
import { logger } from '@barberstack/logger';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet()); app.use(cors()); app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'subscription-service' }));
app.use(requireTenant);
app.use('/subscriptions', subscriptionRouter);
app.listen(PORT, () => logger.info('subscription-service', `🔄 Subscription Service running on port ${PORT}`));
