/**
 * Asaas Subscription Service
 *
 * Nota de segurança: dados de cartão NUNCA são armazenados aqui.
 * Apenas o asaasSubId (token da assinatura) é persistido.
 * O cliente insere o cartão diretamente no checkout do Asaas via paymentLink.
 */

import { prisma } from '@barberstack/database';
import { createSubAccountAsaasClient } from '../asaas.client';

// ─── Busca a API Key da subconta da barbearia ────────────────────────────────
export async function getBarbershopApiKey(barbershopId: string): Promise<string | null> {
  const shop = await prisma.barbershop.findUnique({
    where: { id: barbershopId },
    select: { asaasApiKey: true },
  });
  return shop?.asaasApiKey ?? null;
}

// ─── Cria ou recupera cliente no Asaas (por email) ──────────────────────────
export async function createOrGetAsaasCustomer(
  apiKey: string,
  client: { name: string; email: string; cpfCnpj?: string; phone?: string },
  externalRef?: string,
): Promise<string> {
  const asaas = createSubAccountAsaasClient(apiKey);

  // Verifica se já existe pelo e-mail
  const search = await asaas.get('/customers', { params: { email: client.email, limit: 1 } });
  if (search.data?.data?.length > 0) {
    return search.data.data[0].id as string;
  }

  const created = await asaas.post('/customers', {
    name: client.name,
    email: client.email,
    ...(client.cpfCnpj ? { cpfCnpj: client.cpfCnpj.replace(/\D/g, '') } : {}),
    ...(client.phone   ? { phone: client.phone.replace(/\D/g, '') }     : {}),
    ...(externalRef    ? { externalReference: externalRef }              : {}),
  });

  return created.data.id as string;
}

// ─── Cria assinatura recorrente no Asaas (cartão de crédito) ────────────────
// Retorna { asaasSubId, paymentLink }
// O cliente acessa paymentLink para inserir o cartão — nenhum dado de cartão passa por nós.
export async function createAsaasSubscription(
  apiKey: string,
  customerId: string,
  plan: { name: string; value: number; billingCycle: 'monthly' | 'weekly' },
  nextDueDate: string, // YYYY-MM-DD
): Promise<{ asaasSubId: string; paymentLink: string | null }> {
  const asaas = createSubAccountAsaasClient(apiKey);

  const sub = await asaas.post('/subscriptions', {
    customer:    customerId,
    billingType: 'CREDIT_CARD',
    value:       plan.value,
    nextDueDate,
    cycle:       plan.billingCycle.toUpperCase(), // MONTHLY | WEEKLY
    description: plan.name,
  });

  const asaasSubId: string = sub.data.id;

  // Busca o link de pagamento da primeira cobrança
  let paymentLink: string | null = null;
  try {
    const payments = await asaas.get('/payments', {
      params: { subscription: asaasSubId, limit: 1 },
    });
    paymentLink = payments.data?.data?.[0]?.invoiceUrl ?? null;
  } catch {
    // não crítico — o webhook PAYMENT_CREATED também traz o link
  }

  return { asaasSubId, paymentLink };
}

// ─── Cancela assinatura no Asaas ────────────────────────────────────────────
export async function cancelAsaasSubscription(apiKey: string, asaasSubId: string): Promise<void> {
  const asaas = createSubAccountAsaasClient(apiKey);
  await asaas.delete(`/subscriptions/${asaasSubId}`);
}
