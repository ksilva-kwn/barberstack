import { prisma } from '@barberstack/database';
import { createMasterAsaasClient } from '../asaas.client';

interface CreateSubAccountDto {
  barbershopId: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
}

/**
 * Cria uma subconta White-Label no Asaas para a barbearia.
 * Chamado no momento do cadastro da barbearia.
 */
export async function createAsaasSubAccount(dto: CreateSubAccountDto) {
  const client = createMasterAsaasClient();

  const response = await client.post('/accounts', {
    name: dto.name,
    email: dto.email,
    cpfCnpj: dto.cpfCnpj.replace(/\D/g, ''),
    phone: dto.phone.replace(/\D/g, ''),
    address: dto.address,
    city: dto.city,
    state: dto.state,
    postalCode: undefined,
    accountType: 'EMPRESA',
  });

  const { id: asaasAccountId, apiKey: asaasApiKey, walletId: asaasWalletId } = response.data;

  // Persiste no banco
  await prisma.barbershop.update({
    where: { id: dto.barbershopId },
    data: { asaasAccountId, asaasApiKey, asaasWalletId },
  });

  return { asaasAccountId, asaasApiKey, asaasWalletId };
}

/**
 * Consulta o saldo da subconta da barbearia
 */
export async function getBarbershopBalance(barbershopId: string) {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });

  if (!shop.asaasApiKey) {
    throw new Error('Subconta Asaas não configurada para esta barbearia');
  }

  const { createSubAccountAsaasClient } = await import('../asaas.client');
  const client = createSubAccountAsaasClient(shop.asaasApiKey);
  const response = await client.get('/finance/balance');

  return response.data;
}

/**
 * Solicita saque do saldo da subconta para conta bancária do dono
 */
export async function requestWithdrawal(barbershopId: string, amount: number, bankAccountId: string) {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });

  if (!shop.asaasApiKey) {
    throw new Error('Subconta Asaas não configurada');
  }

  const { createSubAccountAsaasClient } = await import('../asaas.client');
  const client = createSubAccountAsaasClient(shop.asaasApiKey);

  const response = await client.post('/transfers', {
    value: amount,
    bankAccount: { id: bankAccountId },
  });

  return response.data;
}
