'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  UserCog,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

const navItems = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard, adminOnly: false },
  { href: '/agenda',        label: 'Agenda',        icon: Calendar,        adminOnly: false },
  { href: '/barbeiros',     label: 'Barbeiros',     icon: UserCog,         adminOnly: true },
  { href: '/clientes',      label: 'Clientes',      icon: Users,           adminOnly: true },
  { href: '/assinaturas',   label: 'Assinaturas',   icon: Repeat2,         adminOnly: true },
  { href: '/financeiro',    label: 'Financeiro',    icon: DollarSign,      adminOnly: true },
  { href: '/estoque',       label: 'Estoque',       icon: Package,         adminOnly: true },
  { href: '/configuracoes', label: 'Configurações', icon: Settings,        adminOnly: true },
];

const planLabel: Record<string, string> = {
  BRONZE: 'Plano Bronze',
  PRATA:  'Plano Prata',
  OURO:   'Plano Ouro',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

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
        {navItems.filter(item => !item.adminOnly || user?.role === 'ADMIN').map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
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

      {/* Link do portal do cliente */}
      {user?.barbershop?.slug && (
        <div className="px-4 pb-2">
          <a
            href={`/${user.barbershop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Portal do cliente</span>
          </a>
        </div>
      )}

      {/* User / Logout */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 rounded-md text-sm">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-foreground font-medium truncate text-xs">{user?.name ?? '—'}</p>
            <p className="text-muted-foreground truncate text-xs">
              {user?.barbershop?.saasPlan
                ? (planLabel[user.barbershop.saasPlan] ?? user.barbershop.saasPlan)
                : (user?.role ?? '—')}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-muted-foreground hover:text-destructive transition-colors"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
