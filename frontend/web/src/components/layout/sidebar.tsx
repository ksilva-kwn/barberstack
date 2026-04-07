'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Repeat2,
  DollarSign,
  Package,
  Settings,
  Scissors,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

const navItems = [
  { href: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/agenda',    label: 'Agenda',         icon: Calendar },
  { href: '/clientes',  label: 'Clientes',       icon: Users },
  { href: '/assinaturas', label: 'Assinaturas',  icon: Repeat2 },
  { href: '/financeiro',  label: 'Financeiro',   icon: DollarSign },
  { href: '/estoque',     label: 'Estoque',      icon: Package },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const handleLogout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // ignora erros no logout
    }
    clearAuth();
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const planLabel: Record<string, string> = {
    BRONZE: 'Plano Bronze',
    PRATA:  'Plano Prata',
    OURO:   'Plano Ouro',
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">Barberstack</span>
        </div>
        {user?.barbershop && (
          <p className="text-xs text-muted-foreground mt-1 truncate">{user.barbershop.name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors group',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-3 h-3" />}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium truncate text-xs">{user?.name ?? '—'}</p>
            <p className="text-muted-foreground truncate text-xs">
              {user?.barbershop?.saasPlan
                ? planLabel[user.barbershop.saasPlan] ?? user.barbershop.saasPlan
                : user?.role ?? '—'}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="hover:text-destructive transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
