import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { paymentsRouter } from './routes/payments.routes';

const app = express();
const PORT = process.env.PORT || 3005;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'payment-service' });
});

app.use('/payments', paymentsRouter);

app.listen(PORT, () => {
  console.log(`💳 Payment Service running on port ${PORT}`);
});
