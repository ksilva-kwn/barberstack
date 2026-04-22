
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { notificationRouter } from './routes/notification.routes';
import { requireTenant } from './middlewares/tenant.middleware';
import { logger } from '@barberstack/logger';

const app = express();
const PORT = process.env.PORT || 3006;

app.use(helmet()); app.use(cors()); app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'notification-service' }));
app.use(requireTenant);
app.use('/notifications', notificationRouter);
app.listen(PORT, () => logger.info('notification-service', `📲 Notification Service running on port ${PORT}`));
