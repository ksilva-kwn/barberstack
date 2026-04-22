/**
 * Rotas do Payment Service.
 *
 * Segurança: dados de cartão NUNCA trafegam aqui.
 * Apenas tokens Asaas (asaasSubId, paymentLink) são manipulados.
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import {
  getBarbershopBalance,
  requestPixTransfer,
  getOnboardingUrl,
  activateAsaasSubAccount,
  closeAsaasAccount,
  getAccountStatus,
  submitBankAccount,
  uploadDocument,
} from '../services/asaas-account.service';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

export const paymentsRouter: Router = Router();

// ─── Saúde ───────────────────────────────────────────────────────────────────
paymentsRouter.get('/health', (_req: Request, res: Response) => {
  return res.json({ status: 'ok', service: 'payment-service' });
});

// ─── Ativar subconta Asaas (chamado pelo usuário dentro do app) ───────────────
paymentsRouter.post('/activate', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const result = await activateAsaasSubAccount(barbershopId);
    return res.json(result);
  } catch (err: any) {
    console.error('[payment/activate] Erro:', err?.response?.data ?? err.message);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── Link de onboarding Asaas ────────────────────────────────────────────────
paymentsRouter.get('/onboarding-url', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const url = await getOnboardingUrl(barbershopId);
    return res.json({ url });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ─── Saldo da subconta Asaas ─────────────────────────────────────────────────
paymentsRouter.get('/balance', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const balance = await getBarbershopBalance(barbershopId);
    return res.json(balance);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ─── Transferência PIX via CNPJ ──────────────────────────────────────────────
paymentsRouter.post('/transfer', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { value, description } = req.body as { value: number; description?: string };

  if (!value || value <= 0) {
    return res.status(400).json({ error: 'Valor inválido para transferência' });
  }

  try {
    const result = await requestPixTransfer(barbershopId, value, description);
    return res.json(result);
  } catch (err: any) {
    console.error('[payment/transfer] Erro Asaas:', err?.response?.data ?? err.message);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── Status do cadastro Asaas da subconta ────────────────────────────────────
paymentsRouter.get('/account-status', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const status = await getAccountStatus(barbershopId);
    return res.json(status);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

// ─── Dados bancários da subconta ─────────────────────────────────────────────
paymentsRouter.post('/bank-account', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { bankCode, bankName, ownerName, cpfCnpj, agency, account, accountDigit, bankAccountType } = req.body;

  if (!bankCode || !ownerName || !cpfCnpj || !agency || !account) {
    return res.status(400).json({ error: 'Campos obrigatórios: banco, titular, CPF/CNPJ, agência, conta' });
  }

  try {
    const result = await submitBankAccount(barbershopId, { bankCode, bankName, ownerName, cpfCnpj, agency, account, accountDigit: accountDigit ?? '', bankAccountType: bankAccountType ?? 'CONTA_CORRENTE' });
    return res.json(result);
  } catch (err: any) {
    console.error('[payment/bank-account] status:', err?.response?.status);
    console.error('[payment/bank-account] data:', JSON.stringify(err?.response?.data));
    console.error('[payment/bank-account] message:', err?.message);
    const description = err?.response?.data?.errors?.[0]?.description
      || err?.response?.data?.message
      || err?.message
      || 'Erro desconhecido';
    return res.status(400).json({ error: description });
  }
});

// ─── Upload de documento da subconta ─────────────────────────────────────────
paymentsRouter.post('/documents', upload.single('file'), async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  const { type } = req.body;
  const file = (req as any).file;

  if (!file) return res.status(400).json({ error: 'Arquivo obrigatório' });
  if (!type)  return res.status(400).json({ error: 'Tipo de documento obrigatório' });

  try {
    const result = await uploadDocument(barbershopId, type, file.buffer, file.originalname, file.mimetype);
    return res.json(result);
  } catch (err: any) {
    console.error('[payment/documents] Erro:', err?.response?.data ?? err.message);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

// ─── [INTERNAL] Fechar subconta Asaas (balance = 0, conta excluída) ──────────
paymentsRouter.delete('/internal/close-account', async (req: Request, res: Response) => {
  const barbershopId = req.headers['x-barbershop-id'] as string;
  try {
    const result = await closeAsaasAccount(barbershopId);
    return res.json(result);
  } catch (err: any) {
    console.error('[payment/close-account] Erro Asaas:', err?.response?.data ?? err.message);
    return res.status(400).json({ error: err?.response?.data?.errors?.[0]?.description ?? err.message });
  }
});

