import { api } from './api';

export interface Professional {
  id: string;
  userId: string;
  nickname: string | null;
  commissionRate: number;
  isActive: boolean;
  user: { name: string; email: string; phone: string | null; avatarUrl: string | null };
  professionalServices?: { service: BarbershopService }[];
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
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

  createService: (data: Omit<BarbershopService, 'id' | 'isActive'>) =>
    api.post<BarbershopService>('/api/services', data),

  deleteService: (id: string) =>
    api.delete(`/api/services/${id}`),

  professionalServices: (professionalId: string) =>
    api.get<BarbershopService[]>(`/api/professionals/${professionalId}/services`),

  assignService: (professionalId: string, serviceId: string) =>
    api.post(`/api/professionals/${professionalId}/services`, { serviceId }),

  removeService: (professionalId: string, serviceId: string) =>
    api.delete(`/api/professionals/${professionalId}/services/${serviceId}`),

  updateProfessional: (id: string, data: { nickname?: string; commissionRate?: number }) =>
    api.put<Professional>(`/api/professionals/${id}`, data),

  createBarber: (data: { name: string; email: string; phone?: string; password: string; nickname?: string; commissionRate?: number }) =>
    api.post<Professional>('/api/clients/barber', data),

  clients: (search?: string) =>
    api.get<Client[]>('/api/clients', { params: search ? { search } : {} }),

  createClient: (data: { name: string; email: string; phone?: string }) =>
    api.post<Client>('/api/clients', data),
};
