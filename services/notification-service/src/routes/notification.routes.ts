import { Router, Request, Response } from 'express';
import axios from 'axios';
import { logger } from '@barberstack/logger';

export const notificationRouter: Router = Router();

/**
 * Envia lembrete de agendamento via WhatsApp
 * Body: { phone, clientName, professionalName, scheduledAt, services }
 */
notificationRouter.post('/whatsapp/reminder', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { phone, clientName, professionalName, scheduledAt, services } = req.body;

  const date = new Date(scheduledAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const message = `Olá ${clientName}! 💈\n\nLembrando do seu agendamento:\n📅 ${formattedDate}\n✂️ Com: ${professionalName}\n💇 Serviços: ${services}\n\nAté logo!`;

  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    logger.info(barbershopId, `[whatsapp/mock] lembrete para ${phone} — ${clientName}`);
    return res.json({ sent: true, mock: true });
  }

  try {
    await axios.post(
      `${process.env.WHATSAPP_API_URL}/messages`,
      { phone, message },
      { headers: { Authorization: `Bearer ${process.env.WHATSAPP_API_TOKEN}` } },
    );
    return res.json({ sent: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

notificationRouter.post('/whatsapp/confirm', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { phone, clientName, appointmentId } = req.body;
  const message = `Olá ${clientName}! Confirme seu agendamento respondendo SIM. 💈`;

  logger.info(barbershopId, `[whatsapp/confirm] ${phone} — agendamento ${appointmentId}`);
  return res.json({ sent: true, message });
});
