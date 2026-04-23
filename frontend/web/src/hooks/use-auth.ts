'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/auth.api';
import { useAuthStore } from '@/store/auth.store';

export function useAuth() {
  const router = useRouter();
  const { setAuth, clearAuth, user, token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const login = async (email: string, password: string, rememberMe = false, captchaToken?: string) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(email, password, captchaToken);
      setAuth(data.token, data.refreshToken, data.user, rememberMe);
      const role = data.user?.role;
      router.push(role === 'BARBER' ? '/barbeiro' : '/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error;
      setError(msg || 'Email ou senha inválidos.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignora erros no logout
    }
    clearAuth();
    router.push('/login');
  };

  return { login, logout, loading, error, user, isAuthenticated: !!token };
}
