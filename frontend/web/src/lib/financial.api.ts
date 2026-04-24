import { api } from './api';

export type TxType = 'INCOME' | 'EXPENSE';
export type TxStatus = 'PAID' | 'PENDING';

export interface FinancialTransaction {
  id: string;
  barbershopId: string;
  type: TxType;
  title: string;
  category: string;
  amount: number;
  description: string | null;
  paymentMethod: string | null;
  status: TxStatus;
  dueDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface CommissionEntry {
  id: string;
  scheduledAt: string;
  totalAmount: number;
  commissionAmount: number;
}

export interface CommissionReport {
  professionalId: string;
  name: string;
  commissionRate: number;
  totalServices: number;
  grossAmount: number;
  commissionAmount: number;
  appointments: CommissionEntry[];
}

export interface CommissionPayment {
  id: string;
  professionalId: string;
  year: number;
  month: number;
  totalServices: number;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  professional: { nickname: string | null; user: { name: string } };
}

export interface BalanceData {
  period: { from: string; to: string };
  comandaRevenue: number;
  comandaQty: number;
  manualIncome: number;
  manualExpense: number;
  pendingIncome: number;
  pendingExpense: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  byMonth: { month: string; revenue: number; expenses: number }[];
}

export interface ReportData {
  byMethod: { method: string; total: number; qty: number }[];
  byProfessional: { professionalId: string; name: string; total: number; qty: number }[];
  byService: { serviceName: string; total: number; qty: number }[];
  topClients: { clientName: string; total: number; qty: number }[];
  monthlyRevenue: { month: string; revenue: number; qty: number }[];
  totalRevenue: number;
  totalQty: number;
  ticketMedio: number;
}

export type PlanCommissionModel = 'FIXED' | 'PROPORTIONAL' | 'RANKING';

export interface PlanCommissionConfig {
  model: PlanCommissionModel;
  fixedValue: number | null;
  barbershopRate: number;
}

export interface PlanCommissionProfessional {
  professionalId: string;
  name: string;
  totalSubscriptionServices: number;
  commissionAmount: number;
}

export interface PlanCommissionReport {
  model: PlanCommissionModel;
  barbershopRate: number;
  totalRevenue: number;
  barbershopRetention: number;
  distributableRevenue: number;
  totalSubscriptionServices: number;
  professionals: PlanCommissionProfessional[];
}

export interface PlanCommissionPayment {
  id: string;
  professionalId: string;
  year: number;
  month: number;
  model: PlanCommissionModel;
  totalSubscriptionServices: number;
  subscriptionRevenue: number;
  commissionAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  professional: { nickname: string | null; user: { name: string } };
}

export const financialApi = {
  balance: (from?: string, to?: string) =>
    api.get<BalanceData>('/api/financial/balance', { params: { from, to } }),

  transactions: (params?: { type?: TxType; status?: TxStatus; from?: string; to?: string }) =>
    api.get<FinancialTransaction[]>('/api/financial/transactions', { params }),

  createTransaction: (data: Partial<FinancialTransaction>) =>
    api.post<FinancialTransaction>('/api/financial/transactions', data),

  updateTransaction: (id: string, data: Partial<FinancialTransaction>) =>
    api.put<FinancialTransaction>(`/api/financial/transactions/${id}`, data),

  deleteTransaction: (id: string) =>
    api.delete(`/api/financial/transactions/${id}`),

  commissions: (params?: { from?: string; to?: string; professionalId?: string }) =>
    api.get<CommissionReport[]>('/api/financial/commissions', { params }),

  commissionPayments: (params?: { year?: number; professionalId?: string }) =>
    api.get<CommissionPayment[]>('/api/financial/commission-payments', { params }),

  markCommissionPaid: (data: {
    professionalId: string; year: number; month: number;
    totalServices: number; grossAmount: number; commissionRate: number;
    commissionAmount: number; notes?: string;
  }) => api.post<CommissionPayment>('/api/financial/commission-payments', data),

  unmarkCommissionPaid: (id: string) =>
    api.delete(`/api/financial/commission-payments/${id}`),

  report: (from?: string, to?: string) =>
    api.get<ReportData>('/api/financial/report', { params: { from, to } }),

  planCommissions: (params?: { from?: string; to?: string }) =>
    api.get<PlanCommissionReport>('/api/financial/plan-commissions', { params }),

  planCommissionConfig: () =>
    api.get<PlanCommissionConfig>('/api/financial/plan-commission-config'),

  updatePlanCommissionConfig: (data: { model: PlanCommissionModel; fixedValue?: number; barbershopRate?: number }) =>
    api.patch<PlanCommissionConfig>('/api/financial/plan-commission-config', data),

  planCommissionPayments: (params?: { year?: number; professionalId?: string }) =>
    api.get<PlanCommissionPayment[]>('/api/financial/plan-commission-payments', { params }),

  markPlanCommissionPaid: (data: {
    professionalId: string; year: number; month: number; model: string;
    totalSubscriptionServices: number; subscriptionRevenue: number;
    commissionAmount: number; notes?: string;
  }) => api.post<PlanCommissionPayment>('/api/financial/plan-commission-payments', data),

  unmarkPlanCommissionPaid: (id: string) =>
    api.delete(`/api/financial/plan-commission-payments/${id}`),
};

export const EXPENSE_CATEGORIES = [
  'Aluguel', 'Energia', 'Água', 'Internet', 'Telefone',
  'Fornecedor', 'Equipamento', 'Manutenção', 'Marketing',
  'Salário', 'Imposto', 'Outros',
];

export const INCOME_CATEGORIES = [
  'Serviço', 'Produto', 'Assinatura', 'Outros',
];
