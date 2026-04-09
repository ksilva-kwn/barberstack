'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const ALLOWED_ROLES = ['ADMIN', 'BARBER', 'SUPER_ADMIN'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  // hydrated: true após o primeiro mount — momento em que o Zustand persist
  // já leu o localStorage e preencheu o store.
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return; // aguarda hydration antes de tomar decisão

    if (!token) {
      router.replace('/login');
      return;
    }
    if (user && !ALLOWED_ROLES.includes(user.role)) {
      // CLIENT tentando acessar o admin — redireciona para o portal da sua barbearia
      const slug = user.barbershop?.slug;
      router.replace(slug ? `/${slug}` : '/login');
    }
  }, [hydrated, token, user, router]);

  // Enquanto não hidratou, mostra tela em branco (sem flash de redirect)
  if (!hydrated) return null;
  // Após hydration, se não tem token ou role inválido, não renderiza (redirect em curso)
  if (!token) return null;
  if (user && !ALLOWED_ROLES.includes(user.role)) return null;

  return <>{children}</>;
}
