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

export interface Commission {
  id: string;
  professionalId: string;
  appointmentId: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  isPaid: boolean;
  paidAt: string | null;
  createdAt: string;
  professional: { id: string; nickname: string | null; user: { name: string } };
  appointment: { scheduledAt: string; totalAmount: number; paidAt: string | null };
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

  commissions: (params?: { from?: string; to?: string; professionalId?: string; isPaid?: boolean }) =>
    api.get<Commission[]>('/api/financial/commissions', { params }),

  generateCommissions: (from?: string, to?: string) =>
    api.post<{ generated: number }>('/api/financial/commissions/generate', { from, to }),

  payCommission: (id: string) =>
    api.patch<Commission>(`/api/financial/commissions/${id}/pay`, {}),

  report: (from?: string, to?: string) =>
    api.get<ReportData>('/api/financial/report', { params: { from, to } }),
};

export const EXPENSE_CATEGORIES = [
  'Aluguel', 'Energia', 'Água', 'Internet', 'Telefone',
  'Fornecedor', 'Equipamento', 'Manutenção', 'Marketing',
  'Salário', 'Imposto', 'Outros',
];

export const INCOME_CATEGORIES = [
  'Serviço', 'Produto', 'Assinatura', 'Outros',
];
