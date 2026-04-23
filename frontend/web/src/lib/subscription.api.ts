import { api } from './api';

export type SubStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'DEFAULTING' | 'CANCELING' | 'CANCELED' | 'SUSPENDED';

export interface PlanService {
  serviceId: string;
  limitPerCycle: number | null;
  service: { id: string; name: string };
}

export interface ClientPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: 'monthly' | 'weekly';
  isActive: boolean;
  isFeatured: boolean;
  allowMultiBranch: boolean;
  createdAt: string;
  services: PlanService[];
  _count?: { subscriptions: number };
}

export interface ClientSubscription {
  id: string;
  clientId: string;
  clientPlanId: string;
  status: SubStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextPaymentAt: string | null;
  lastPaymentAt: string | null;
  asaasSubId: string | null;
  paymentLink: string | null;
  canceledAt: string | null;
  createdAt: string;
  client: { name: string; email: string; phone: string | null };
  clientPlan: { name: string; price: number; billingCycle: string };
}

export interface SubscriptionReports {
  mrr: number;
  activeCount: number;
  defaultingCount: number;
  canceledThisMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
  topPlans: { planId: string; planName: string; count: number; mrr: number }[];
}

export const subscriptionApi = {
  // ── Planos ──────────────────────────────────────────────────────────────────
  plans: (all = false) =>
    api.get<ClientPlan[]>('/api/subscriptions/plans', { params: all ? { all: 'true' } : {} }),

  createPlan: (data: {
    name: string; price: number; billingCycle: string;
    description?: string; isFeatured?: boolean; allowMultiBranch?: boolean; serviceIds: string[];
  }) => api.post<ClientPlan>('/api/subscriptions/plans', data),

  updatePlan: (id: string, data: {
    name?: string; price?: number;
    description?: string | null; isFeatured?: boolean; allowMultiBranch?: boolean; serviceIds?: string[];
  }) => api.put<ClientPlan>(`/api/subscriptions/plans/${id}`, data),

  togglePlan: (id: string) =>
    api.patch<ClientPlan>(`/api/subscriptions/plans/${id}/toggle`),

  // ── Assinaturas ─────────────────────────────────────────────────────────────
  subscriptions: (status?: SubStatus) =>
    api.get<ClientSubscription[]>('/api/subscriptions', {
      params: status ? { status } : {},
    }),

  subscribe: (data: { clientId: string; clientPlanId: string }) =>
    api.post<ClientSubscription>('/api/subscriptions', data),

  cancel: (id: string) =>
    api.delete(`/api/subscriptions/${id}`),

  // ── Relatórios ──────────────────────────────────────────────────────────────
  reports: () =>
    api.get<SubscriptionReports>('/api/subscriptions/reports'),
};
