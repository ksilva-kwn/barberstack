import { api } from './api';

export interface Branch {
  id: string;
  barbershopId: string;
  name: string;
  address: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  isMain: boolean;
  isActive: boolean;
}

export interface Professional {
  id: string;
  userId: string;
  nickname: string | null;
  commissionRate: number;
  isActive: boolean;
  branchId: string | null;
  branch: { id: string; name: string } | null;
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

export interface ClientStats {
  totalActive: number;
  totalBlocked: number;
  newLast30: number;
  inactiveCount: number;
  topByVisits: { id: string; name: string; visits: number; revenue: number; lastVisit: string }[];
  topByRevenue: { id: string; name: string; visits: number; revenue: number; lastVisit: string }[];
  newByMonth: { month: string; count: number }[];
  preferredDow: { day: string; count: number }[];
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

export interface BarbershopPortal {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
}

export interface BarbershopSettings {
  id: string;
  name: string;
  phone: string;
  email: string;
  document: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
}

export interface BarbershopPhoto {
  id: string;
  url: string;
  caption: string | null;
  order: number;
}

export const barbershopApi = {
  getPortal: (barbershopId: string) =>
    api.get<BarbershopPortal>(`/api/barbershops/${barbershopId}`),

  updatePortal: (barbershopId: string, data: { slug?: string; coverUrl?: string | null; logoUrl?: string | null; description?: string | null }) =>
    api.put<BarbershopPortal>(`/api/barbershops/${barbershopId}/portal`, data),

  updateSettings: (barbershopId: string, data: Partial<Omit<BarbershopSettings, 'id' | 'document'>>) =>
    api.put<BarbershopSettings>(`/api/barbershops/${barbershopId}/settings`, data),

  photos: (barbershopId: string) =>
    api.get<BarbershopPhoto[]>(`/api/barbershops/${barbershopId}/photos`),

  addPhoto: (barbershopId: string, data: { url: string; caption?: string }) =>
    api.post<BarbershopPhoto>(`/api/barbershops/${barbershopId}/photos`, data),

  deletePhoto: (barbershopId: string, photoId: string) =>
    api.delete(`/api/barbershops/${barbershopId}/photos/${photoId}`),


  kpis: (barbershopId: string, params?: { professionalId?: string; branchId?: string }) =>
    api.get<DashboardKpis>(`/api/barbershops/${barbershopId}/kpis`, { params }),

  revenueChart: (barbershopId: string, params?: { professionalId?: string; branchId?: string; months?: number }) =>
    api.get<RevenueDataPoint[]>(`/api/barbershops/${barbershopId}/revenue-chart`, { params }),

  originChart: (barbershopId: string, params?: { professionalId?: string; branchId?: string }) =>
    api.get<OriginDataPoint[]>(`/api/barbershops/${barbershopId}/origin-chart`, { params }),

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

  updateProfessional: (id: string, data: { nickname?: string; commissionRate?: number; branchId?: string | null }) =>
    api.put<Professional>(`/api/professionals/${id}`, data),

  branches: (barbershopId: string) =>
    api.get<Branch[]>(`/api/barbershops/${barbershopId}/branches`),

  createBranch: (barbershopId: string, data: Omit<Branch, 'id' | 'barbershopId' | 'isActive'>) =>
    api.post<Branch>(`/api/barbershops/${barbershopId}/branches`, data),

  updateBranch: (barbershopId: string, branchId: string, data: Partial<Omit<Branch, 'id' | 'barbershopId'>>) =>
    api.put<Branch>(`/api/barbershops/${barbershopId}/branches/${branchId}`, data),

  deleteBranch: (barbershopId: string, branchId: string) =>
    api.delete(`/api/barbershops/${barbershopId}/branches/${branchId}`),

  createBarber: (data: { name: string; email: string; phone?: string; password: string; nickname?: string; commissionRate?: number }) =>
    api.post<Professional>('/api/clients/barber', data),

  clients: (search?: string) =>
    api.get<Client[]>('/api/clients', { params: search ? { search } : {} }),

  clientsBlocked: (search?: string) =>
    api.get<Client[]>('/api/clients', { params: { blocked: 'true', ...(search ? { search } : {}) } }),

  createClient: (data: { name: string; email: string; phone?: string }) =>
    api.post<Client>('/api/clients', data),

  blockClient: (id: string) =>
    api.patch(`/api/clients/${id}/block`, { blocked: true }),

  unblockClient: (id: string) =>
    api.patch(`/api/clients/${id}/block`, { blocked: false }),

  clientStats: () =>
    api.get<ClientStats>('/api/clients/stats'),
};
