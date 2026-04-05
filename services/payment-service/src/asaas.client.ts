import axios, { AxiosInstance } from 'axios';

const ASAAS_URLS = {
  sandbox: 'https://sandbox.asaas.com/api/v3',
  production: 'https://api.asaas.com/v3',
};

// Cliente Asaas para a conta MASTER do SaaS
export function createMasterAsaasClient(): AxiosInstance {
  const env = (process.env.ASAAS_ENV || 'sandbox') as 'sandbox' | 'production';
  return axios.create({
    baseURL: ASAAS_URLS[env],
    headers: {
      access_token: process.env.ASAAS_MASTER_API_KEY!,
      'Content-Type': 'application/json',
    },
  });
}

// Cliente Asaas para a SUBCONTA de uma barbearia
export function createSubAccountAsaasClient(subAccountApiKey: string): AxiosInstance {
  const env = (process.env.ASAAS_ENV || 'sandbox') as 'sandbox' | 'production';
  return axios.create({
    baseURL: ASAAS_URLS[env],
    headers: {
      access_token: subAccountApiKey,
      'Content-Type': 'application/json',
    },
  });
}
