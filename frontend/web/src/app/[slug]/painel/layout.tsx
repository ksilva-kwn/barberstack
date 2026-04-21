'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Calendar, CreditCard, User, Scissors, LogOut, CalendarPlus,
} from 'lucide-react';
import { portalApi } from '@/lib/public.api';
import { cn } from '@/lib/utils';

const navItems = (slug: string) => [
  { href: `/${slug}/painel`,            label: 'Início',        icon: LayoutDashboard },
  { href: `/${slug}/painel/agendamentos`, label: 'Agendamentos', icon: Calendar },
  { href: `/${slug}/painel/assinatura`,   label: 'Assinatura',   icon: CreditCard },
  { href: `/${slug}/painel/conta`,        label: 'Conta',        icon: User },
];

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (!raw) { router.replace(`/${slug}/entrar`); return; }
    setAuth(JSON.parse(raw));
    setReady(true);
  }, [slug]);

  const { data: shop } = useQuery({
    queryKey: ['public-shop', slug],
    queryFn: () => portalApi.shop(slug).then(r => r.data),
    enabled: !!slug,
  });

  const handleLogout = () => {
    sessionStorage.removeItem(`portal-auth-${slug}`);
    router.push(`/${slug}`);
  };

  if (!ready) return null;

  const nav = navItems(slug);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* ── Sidebar desktop ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r border-border bg-card">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          {shop?.logoUrl ? (
            <img src={shop.logoUrl} className="w-8 h-8 rounded-lg object-cover" alt="" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="font-bold text-sm truncate">{shop?.name ?? '...'}</span>
        </div>

        {/* CTA agendar */}
        <div className="px-4 pt-4">
          <Link
            href={`/${slug}/agendar`}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <CalendarPlus className="w-4 h-4" /> Agendar horário
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50',
                )}
              >
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-4">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors w-full"
          >
            <LogOut className="w-4 h-4" /> Sair
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-10 h-14 border-b border-border bg-background/95 backdrop-blur flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} className="w-7 h-7 rounded-lg object-cover" alt="" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Scissors className="w-3.5 h-3.5 text-primary" />
              </div>
            )}
            <span className="font-bold text-sm">{shop?.name ?? '...'}</span>
          </div>
          <Link
            href={`/${slug}/agendar`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold"
          >
            <CalendarPlus className="w-3.5 h-3.5" /> Agendar
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 max-w-3xl w-full mx-auto pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border flex items-center justify-around px-2 z-20">
          {nav.map(item => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
