import { Router, Request, Response } from 'express';
import axios from 'axios';

export const notificationRouter = Router();

/**
 * Envia lembrete de agendamento via WhatsApp
 * Body: { phone, clientName, professionalName, scheduledAt, services }
 */
notificationRouter.post('/whatsapp/reminder', async (req: Request, res: Response) => {
  const { phone, clientName, professionalName, scheduledAt, services } = req.body;

  const date = new Date(scheduledAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  const message = `Olá ${clientName}! 💈\n\nLembrando do seu agendamento:\n📅 ${formattedDate}\n✂️ Com: ${professionalName}\n💇 Serviços: ${services}\n\nAté logo!`;

  if (!process.env.WHATSAPP_API_URL || !process.env.WHATSAPP_API_TOKEN) {
    console.log('[WhatsApp Mock]', { phone, message });
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
  const { phone, clientName, appointmentId } = req.body;
  const message = `Olá ${clientName}! Confirme seu agendamento respondendo SIM. 💈`;

  console.log('[WhatsApp Confirm]', { phone, message, appointmentId });
  return res.json({ sent: true, message });
});
