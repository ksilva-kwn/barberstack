process.env.TZ = 'America/Sao_Paulo'; // deve ser a primeira linha — Node cacheia TZ no boot

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { barbershopRouter } from './routes/barbershop.routes';
import { professionalRouter } from './routes/professional.routes';
import { serviceRouter } from './routes/service.routes';
import { usersRouter } from './routes/users.routes';
import { productRouter } from './routes/product.routes';
import { financialRouter } from './routes/financial.routes';
import { publicRouter } from './routes/public.routes';
import { requireTenant } from './middlewares/tenant.middleware';

const app = express();
const PORT = process.env.PORT || 3002;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'barbershop-service' }));

// Rotas públicas (sem auth)
app.use('/public', publicRouter);

app.use(requireTenant);
app.use('/barbershops', barbershopRouter);
app.use('/professionals', professionalRouter);
app.use('/services', serviceRouter);
app.use('/users', usersRouter);
app.use('/products', productRouter);
app.use('/financial', financialRouter);

app.listen(PORT, () => console.log(`✂️  Barbershop Service running on port ${PORT}`));
