import { api } from './api';

export interface AsaasBalance {
  balance: number;
  totalTransfers: number;
  configured: boolean;
}

export interface AsaasTransferResult {
  id: string;
  status: string;
  value: number;
  type: string;
  transferFee: number;
  effectiveDate: string;
}

export const paymentApi = {
  balance: () =>
    api.get<AsaasBalance>('/api/payments/balance'),

  transfer: (value: number, description?: string) =>
    api.post<AsaasTransferResult>('/api/payments/transfer', { value, description }),

  onboardingUrl: () =>
    api.get<{ url: string | null }>('/api/payments/onboarding-url'),

  activate: () =>
    api.post<{ onboardingUrl: string | null; alreadyActivated: boolean }>('/api/payments/activate'),
};
