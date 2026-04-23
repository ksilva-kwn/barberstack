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

const DAY_MS   = 86_400_000;
const DAY_SEC  = 86_400;

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  expiresAt: number | null;
  setAuth: (token: string, refreshToken: string, user: AuthUser, rememberMe?: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      expiresAt: null,
      setAuth: (token, refreshToken, user, rememberMe = false) => {
        const maxAgeSec  = rememberMe ? 30 * DAY_SEC : DAY_SEC;
        const expiresAt  = Date.now() + (rememberMe ? 30 * DAY_MS : DAY_MS);
        if (typeof document !== 'undefined') {
          document.cookie = `barberstack-session=1; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
          document.cookie = `barberstack-role=${user.role}; path=/; max-age=${maxAgeSec}; SameSite=Lax`;
        }
        set({ token, refreshToken, user, expiresAt });
      },
      clearAuth: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'barberstack-session=; path=/; max-age=0';
          document.cookie = 'barberstack-role=; path=/; max-age=0';
        }
        set({ token: null, refreshToken: null, user: null, expiresAt: null });
      },
    }),
    { name: 'barberstack-auth' },
  ),
);
