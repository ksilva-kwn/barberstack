import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  barbershopId?: string | null;
  barbershop?: { id: string; name: string; saasPlan: string; slug: string } | null;
}

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (token, refreshToken, user) => {
        if (typeof document !== 'undefined') {
          document.cookie = 'barberstack-session=1; path=/; max-age=604800; SameSite=Lax';
          document.cookie = `barberstack-role=${user.role}; path=/; max-age=604800; SameSite=Lax`;
        }
        set({ token, refreshToken, user });
      },
      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'barberstack-session=; path=/; max-age=0';
          document.cookie = 'barberstack-role=; path=/; max-age=0';
        }
        set({ token: null, refreshToken: null, user: null });
      },
    }),
    { name: 'barberstack-auth' },
  ),
);
