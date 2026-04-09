import axios from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const publicApi = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

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

export const portalApi = {
  shop: (slug: string) =>
    publicApi.get<PublicShop>(`/api/public/shop/${slug}`),

  professionals: (slug: string) =>
    publicApi.get<PublicProfessional[]>(`/api/public/shop/${slug}/professionals`),

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

  login: (email: string, password: string) =>
    publicApi.post<{ token: string; refreshToken: string; user: any }>('/api/auth/login', { email, password }),

  register: (data: { name: string; email: string; password: string; phone?: string; barbershopId: string }) =>
    publicApi.post<{ token: string; user: any }>('/api/auth/register', data),
};
