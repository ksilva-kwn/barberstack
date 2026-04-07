'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    } else {
      setChecked(true);
    }
  }, [token, router]);

  if (!checked) return null;

  return <>{children}</>;
}
