import { api } from './api';

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
};
