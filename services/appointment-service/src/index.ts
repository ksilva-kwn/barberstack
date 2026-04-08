
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { appointmentRouter } from './routes/appointment.routes';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet()); app.use(cors()); app.use(express.json());
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'appointment-service' }));
app.use('/appointments', appointmentRouter);
app.listen(PORT, () => console.log(`📅 Appointment Service running on port ${PORT}`));
