process.env.TZ = 'America/Sao_Paulo'; // deve ser a primeira linha — Node cacheia TZ no boot

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { appointmentRouter } from './routes/appointment.routes';
import { publicAppointmentRouter } from './routes/public.routes';
import { requireTenant } from './middlewares/tenant.middleware';
import { logger } from '@barberstack/logger';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet()); app.use(cors()); app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'appointment-service' }));

// Rotas públicas (sem tenant middleware)
app.use('/public', publicAppointmentRouter);

app.use(requireTenant);
app.use('/appointments', appointmentRouter);
app.listen(PORT, () => logger.info('appointment-service', `📅 Appointment Service running on port ${PORT}`));
