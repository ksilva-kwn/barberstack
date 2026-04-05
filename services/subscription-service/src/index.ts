import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { subscriptionRouter } from './routes/subscription.routes';

const app = express();
const PORT = process.env.PORT || 3004;

app.use(helmet()); app.use(cors()); app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'subscription-service' }));
app.use('/subscriptions', subscriptionRouter);
app.listen(PORT, () => console.log(`🔄 Subscription Service running on port ${PORT}`));
