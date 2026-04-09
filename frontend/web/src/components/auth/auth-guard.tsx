'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

const ALLOWED_ROLES = ['ADMIN', 'BARBER', 'SUPER_ADMIN'];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (user && !ALLOWED_ROLES.includes(user.role)) {
      // CLIENT tentando acessar o admin — redireciona para o portal da sua barbearia
      const slug = user.barbershop?.slug;
      router.replace(slug ? `/${slug}` : '/login');
      return;
    }
    setChecked(true);
  }, [token, user, router]);

  if (!checked) return null;

  return <>{children}</>;
}
