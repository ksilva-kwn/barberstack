import { api } from './api';
import type { AuthUser } from '@/store/auth.store';

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  token: string;
}

export interface RegisterBarbershopPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  barbershopName: string;
  document: string;
  barbershopPhone: string;
  barbershopEmail: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  companyType?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>('/api/auth/login', { email, password }),

  logout: (refreshToken: string) =>
    api.post('/api/auth/logout', { refreshToken }),

  refresh: (refreshToken: string) =>
    api.post<RefreshResponse>('/api/auth/refresh', { refreshToken }),

  me: () =>
    api.get<AuthUser>('/api/auth/me'),

  registerBarbershop: (payload: RegisterBarbershopPayload) =>
    api.post<LoginResponse>('/api/auth/register/barbershop', payload),
};
