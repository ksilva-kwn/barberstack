import { prisma } from '@barberstack/database';
import { createMasterAsaasClient, createSubAccountAsaasClient } from '../asaas.client';
import { logger } from '@barberstack/logger';

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

  await prisma.barbershop.update({
    where: { id: dto.barbershopId },
    data: { asaasAccountId, asaasApiKey, asaasWalletId },
  });

  return { asaasAccountId, asaasApiKey, asaasWalletId };
}

/**
 * Cria a subconta Asaas usando os dados já salvos no banco.
 * Chamado quando o usuário clica em "Ativar cobranças" dentro do app.
 */
export async function activateAsaasSubAccount(barbershopId: string) {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });

  if (shop.asaasAccountId) {
    const onboardingUrl = await getOnboardingUrl(barbershopId);
    return { alreadyActivated: true, onboardingUrl };
  }

  if (!shop.document) throw new Error('CNPJ não cadastrado');
  if (!shop.phone)    throw new Error('Telefone não cadastrado');

  let result: { asaasAccountId: string; asaasApiKey: string | null; asaasWalletId: string | null };
  try {
    result = await createAsaasSubAccount({
      barbershopId,
      name:        shop.name,
      email:       shop.email,
      cpfCnpj:     shop.document,
      phone:       shop.phone,
      address:     shop.address    ?? undefined,
      city:        shop.city       ?? undefined,
      state:       shop.state      ?? undefined,
      postalCode:  shop.zipCode    ?? undefined,
      companyType: shop.companyType ?? 'INDIVIDUAL',
      incomeValue: shop.incomeValue ? Number(shop.incomeValue) : 5000,
    });
  } catch (err: any) {
    const isCnpjInUse = JSON.stringify(err?.response?.data ?? '').toLowerCase().includes('cpfcnpj');
    if (isCnpjInUse) {
      throw new Error('CNPJ_ALREADY_IN_USE');
    }
    throw err;
  }

  const onboardingUrl = await getOnboardingUrl(barbershopId);
  return { ...result, alreadyActivated: false, onboardingUrl };
}

/**
 * Retorna o link de onboarding do Asaas para a subconta enviar documentos.
 * Usa GET /myAccount/documents e extrai o primeiro onboardingUrl disponível.
 */
export async function getOnboardingUrl(barbershopId: string): Promise<string | null> {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });
  if (!shop.asaasApiKey) return null;

  const subClient = createSubAccountAsaasClient(shop.asaasApiKey);

  // 1) GET /myAccount/documents — retorna onboardingUrl por documento (fluxo correto da doc)
  try {
    const res = await subClient.get('/myAccount/documents');
    const docs: Array<{ onboardingUrl?: string }> = res.data?.data ?? res.data ?? [];
    const url = docs.find(d => d.onboardingUrl)?.onboardingUrl ?? null;
    if (url) {
      logger.info(shop.name, `[asaas/documents] onboardingUrl encontrada`);
      return url;
    }
    logger.warn(shop.name, `[asaas/documents] nenhum documento com onboardingUrl`);
  } catch (err: any) {
    logger.warn(shop.name, `[asaas/documents] falhou: ${err?.response?.status} ${JSON.stringify(err?.response?.data ?? err.message)}`);
  }

  // 2) Fallback: /myAccount/loginUrl
  try {
    const res = await subClient.get('/myAccount/loginUrl');
    const url = res.data?.loginUrl ?? res.data?.url ?? null;
    if (url) return url;
  } catch (err: any) {
    logger.warn(shop.name, `[asaas/loginUrl] falhou: ${err?.response?.status}`);
  }

  return null;
}

/**
 * Atualiza o email da subconta Asaas via POST /myAccount/commercialInfo.
 */
export async function updateSubAccountEmail(barbershopId: string, email: string): Promise<void> {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });
  if (!shop.asaasApiKey) throw new Error('Subconta Asaas não configurada');

  const subClient = createSubAccountAsaasClient(shop.asaasApiKey);
  await subClient.post('/myAccount/commercialInfo', { email });

  logger.info(shop.name, `[asaas/commercialInfo] email atualizado para ${email}`);
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
 * Remove a subconta Asaas da barbearia (chamado apenas quando saldo = 0).
 */
export async function closeAsaasAccount(barbershopId: string) {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });

  if (!shop.asaasAccountId) return { skipped: true, reason: 'no_account' };

  const client = createMasterAsaasClient();
  await client.delete(`/accounts/${shop.asaasAccountId}`);

  return { removed: true };
}

/**
 * Retorna os itens pendentes do cadastro da subconta Asaas.
 */
export async function getAccountStatus(barbershopId: string) {
  const shop = await prisma.barbershop.findUniqueOrThrow({ where: { id: barbershopId } });
  if (!shop.asaasApiKey) return { configured: false, items: [] };

  const client = createSubAccountAsaasClient(shop.asaasApiKey);
  try {
    const res = await client.get('/myAccount/commercialInfo');
    const data = res.data;
    return {
      configured: true,
      status: data.accountStatus ?? null,
      bankAccountInfoProvided: data.bankAccountInfoProvided ?? false,
      documentStatus: data.documentStatus ?? 'PENDING',
    };
  } catch {
    return { configured: true, status: null, bankAccountInfoProvided: false, documentStatus: 'PENDING' };
  }
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
