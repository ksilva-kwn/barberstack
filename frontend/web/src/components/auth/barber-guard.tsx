'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function BarberGuard({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const token    = useAuthStore((s) => s.token);
  const user     = useAuthStore((s) => s.user);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) { router.replace('/login'); return; }
    // ADMIN também pode acessar a view de barbeiro (dono que também é barbeiro)
    if (user && !['BARBER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      router.replace('/login');
    }
  }, [hydrated, token, user, router]);

  if (!hydrated || !token) return null;
  if (user && !['BARBER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) return null;

  return <>{children}</>;
}
