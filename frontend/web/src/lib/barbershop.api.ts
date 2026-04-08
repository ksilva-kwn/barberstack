import { api } from './api';

export interface Professional {
  id: string;
  userId: string;
  nickname: string | null;
  commissionRate: number;
  isActive: boolean;
  user: { name: string; email: string; phone: string | null; avatarUrl: string | null };
}

export interface BarbershopService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  durationMins: number;
  isActive: boolean;
}

export interface DashboardKpis {
  professionals: number;
  appointmentsMonth: number;
  activeSubscriptions: number;
  revenueMonth: number;
  openCommands: number;
  defaulting: number;
}

export interface RevenueDataPoint {
  month: string;
  revenue: number;
}

export interface OriginDataPoint {
  name: string;
  value: number;
}

export const barbershopApi = {
  kpis: (barbershopId: string) =>
    api.get<DashboardKpis>(`/api/barbershops/${barbershopId}/kpis`),

  revenueChart: (barbershopId: string) =>
    api.get<RevenueDataPoint[]>(`/api/barbershops/${barbershopId}/revenue-chart`),

  originChart: (barbershopId: string) =>
    api.get<OriginDataPoint[]>(`/api/barbershops/${barbershopId}/origin-chart`),

  professionals: () =>
    api.get<Professional[]>('/api/professionals'),

  services: () =>
    api.get<BarbershopService[]>('/api/services'),
};
