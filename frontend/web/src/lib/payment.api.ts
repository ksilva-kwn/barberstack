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

export interface AsaasAccountStatus {
  configured: boolean;
  status: string | null;
  bankAccountInfoProvided: boolean;
  documentStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'AWAITING_APPROVAL';
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

  accountStatus: () =>
    api.get<AsaasAccountStatus>('/api/payments/account-status'),

  updateEmail: (email: string) =>
    api.patch<{ ok: boolean }>('/api/payments/update-email', { email }),
};
