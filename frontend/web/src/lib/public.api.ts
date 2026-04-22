import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export interface PublicBranch {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  isMain: boolean;
}

export interface PublicShop {
  id: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  slug: string;
}

export interface ClientAppointment {
  id: string;
  scheduledAt: string;
  durationMins: number;
  status: string;
  totalAmount: number;
  professional: { user: { name: string; avatarUrl: string | null } };
  services: { service: { name: string } }[];
}

export interface PublicProfessional {
  id: string;
  nickname: string | null;
  user: { name: string; avatarUrl: string | null };
  professionalServices: { service: { id: string; name: string; description: string | null; price: number; durationMins: number; isActive: boolean } }[];
}

export interface PublicService {
  id: string;
  name: string;
  price: number;
  durationMins: number;
  description: string | null;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface PublicPhoto {
  id: string;
  url: string;
  caption: string | null;
}

export interface PublicPlan {
  id: string;
  name: string;
  description: string | null;
  price: number;
  billingCycle: 'monthly' | 'weekly';
  isFeatured: boolean;
  services: { service: { id: string; name: string }; limitPerCycle: number | null }[];
}

export interface ClientSubscription {
  id: string;
  clientPlanId: string;
  status: 'ACTIVE' | 'DEFAULTING' | 'CANCELING' | 'CANCELED' | string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canceledAt: string | null;
  paymentLink: string | null;
  clientPlan: PublicPlan & {
    services: { service: { id: string; name: string }; limitPerCycle: number | null }[];
  };
}

export const portalApi = {
  shop: (slug: string) =>
    publicApi.get<PublicShop>(`/api/public/shop/${slug}`),

  branches: (slug: string) =>
    publicApi.get<PublicBranch[]>(`/api/public/shop/${slug}/branches`),

  professionals: (slug: string, branchId?: string) =>
    publicApi.get<PublicProfessional[]>(`/api/public/shop/${slug}/professionals`, {
      params: branchId ? { branchId } : {},
    }),

  slots: (barbershopId: string, professionalId: string, date: string, durationMins: number) =>
    publicApi.get<TimeSlot[]>('/api/public/slots', {
      params: { barbershopId, professionalId, date, durationMins },
    }),

  createAppointment: (token: string, data: {
    professionalId: string;
    scheduledAt: string;
    serviceIds: string[];
    notes?: string;
  }) =>
    publicApi.post('/api/public/appointments', data, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  photos: (slug: string) =>
    publicApi.get<PublicPhoto[]>(`/api/public/shop/${slug}/photos`),

  login: (email: string, password: string) =>
    publicApi.post<{ token: string; refreshToken: string; user: any }>('/api/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; phone?: string; barbershopId: string }) =>
    publicApi.post<{ token: string; user: any }>('/api/auth/register', data),

  myAppointments: (token: string) =>
    publicApi.get<{ upcoming: ClientAppointment[]; past: ClientAppointment[] }>('/api/public/my-appointments', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  plans: (slug: string) =>
    publicApi.get<PublicPlan[]>(`/api/public/shop/${slug}/plans`),

  mySubscription: (token: string, slug: string) =>
    publicApi.get<ClientSubscription | null>('/api/subscriptions/my', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  subscribe: (token: string, clientId: string, clientPlanId: string) =>
    publicApi.post('/api/subscriptions', { clientId, clientPlanId }, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  cancelSubscription: (token: string, subscriptionId: string) =>
    publicApi.delete(`/api/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
