import { prisma } from '@barberstack/database';
import { createMasterAsaasClient, createSubAccountAsaasClient } from '../asaas.client';

interface CreateSubAccountDto {
  barbershopId: string;
  name: string;
  email: string;
  cpfCnpj: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  companyType?: string;
  incomeValue?: number;
}

/**
 * Cria uma subconta White-Label no Asaas para a barbearia.
 * Chamado automaticamente no momento do cadastro da barbearia.
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
    postalCode: dto.postalCode?.replace(/\D/g, ''),
    accountType: 'EMPRESA',
    companyType: dto.companyType ?? 'INDIVIDUAL',
    incomeValue: dto.incomeValue ?? 5000,
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
 * Retorna o link de onboarding White-Label do Asaas para a subconta completar o cadastro.
 */
export async function getOnboardingUrl(barbershopId: string): Promise<string | null> {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });
  if (!shop.asaasAccountId) return null;

  const client = createMasterAsaasClient();
  try {
    const response = await client.get(`/accounts/${shop.asaasAccountId}/onboardingUrl`);
    return response.data?.onboardingUrl ?? response.data?.url ?? null;
  } catch {
    return null;
  }
}

/**
 * Consulta o saldo disponível da subconta da barbearia no Asaas.
 */
export async function getBarbershopBalance(barbershopId: string) {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });

  if (!shop.asaasApiKey) {
    // Subconta ainda não configurada — retorna saldo zerado sem erro
    return { balance: 0, configured: false };
  }

  const client = createSubAccountAsaasClient(shop.asaasApiKey);
  const response = await client.get('/finance/balance');

  return { ...response.data, configured: true };
}

/**
 * Solicita transferência via PIX usando o CNPJ da barbearia como chave.
 * O dinheiro é sacado da subconta Asaas direto para a conta bancária vinculada ao CNPJ.
 */
export async function requestPixTransfer(barbershopId: string, amount: number, description?: string) {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });

  if (!shop.asaasApiKey) {
    throw new Error('Subconta Asaas não configurada para esta barbearia');
  }
  if (!shop.document) {
    throw new Error('CNPJ da barbearia não cadastrado');
  }

  const client = createSubAccountAsaasClient(shop.asaasApiKey);
  const cnpj = shop.document.replace(/\D/g, '');

  const response = await client.post('/transfers', {
    value: amount,
    pixAddressKey: cnpj,
    pixAddressKeyType: 'CNPJ',
    description: description || 'Saque Barberstack',
    operationType: 'PIX',
  });

  return response.data;
}
