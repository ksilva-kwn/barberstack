'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Scissors,
  UserCog,
  Users,
  Repeat2,
  DollarSign,
  Package,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  FileText,
  CheckSquare,
  BarChart2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

interface SubItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;       // se tem href = link direto sem submenu
  adminOnly: boolean;
  children?: SubItem[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
    adminOnly: false,
  },
  {
    label: 'Agenda',
    icon: Calendar,
    href: '/agenda',
    adminOnly: false,
  },
  {
    label: 'Serviços',
    icon: Scissors,
    href: '/servicos',
    adminOnly: false,
  },
  {
    label: 'Barbeiros',
    icon: UserCog,
    href: '/barbeiros',
    adminOnly: true,
  },
  {
    label: 'Clientes',
    icon: Users,
    href: '/clientes',
    adminOnly: true,
  },
  {
    label: 'Assinaturas',
    icon: Repeat2,
    href: '/assinaturas',
    adminOnly: true,
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    adminOnly: true,
    children: [
      { label: 'Comandas abertas',   href: '/financeiro/comandas',          icon: <FileText className="w-3.5 h-3.5" /> },
      { label: 'Comandas fechadas',  href: '/financeiro/comandas/fechadas', icon: <CheckSquare className="w-3.5 h-3.5" /> },
      { label: 'Relatórios',         href: '/financeiro/relatorios',        icon: <BarChart2 className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Estoque',
    icon: Package,
    href: '/estoque',
    adminOnly: true,
  },
  {
    label: 'Configurações',
    icon: Settings,
    href: '/configuracoes',
    adminOnly: true,
  },
];

const planLabel: Record<string, string> = {
  BRONZE: 'Plano Bronze',
  PRATA:  'Plano Prata',
  OURO:   'Plano Ouro',
};

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // Auto-abre o item cujo filho está ativo
  const initialOpen = navItems
    .filter(item => item.children?.some(c => pathname.startsWith(c.href)))
    .map(item => item.label);

  const [openItems, setOpenItems] = useState<string[]>(initialOpen);

  // Reabre quando a rota muda (ex: navegação direta via URL)
  useEffect(() => {
    navItems.forEach(item => {
      if (item.children?.some(c => pathname.startsWith(c.href))) {
        setOpenItems(prev => prev.includes(item.label) ? prev : [...prev, item.label]);
      }
    });
  }, [pathname]);

  const toggleItem = (label: string) => {
    setOpenItems(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    );
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const filtered = navItems.filter(item => !item.adminOnly || user?.role === 'ADMIN');

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
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {filtered.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openItems.includes(item.label);

          // Ativo: link direto bate com pathname, ou algum filho bate
          const isActive = item.href
            ? pathname === item.href || pathname.startsWith(item.href + '/')
            : item.children?.some(c => pathname.startsWith(c.href)) ?? false;

          if (!hasChildren && item.href) {
            return (
              <Link
                key={item.label}
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
              </Link>
            );
          }

          // Item com submenus
          return (
            <div key={item.label}>
              <button
                onClick={() => toggleItem(item.label)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive && !isOpen
                    ? 'bg-primary text-primary-foreground'
                    : isActive
                      ? 'text-foreground bg-accent'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                <ChevronDown
                  className={cn(
                    'w-3.5 h-3.5 shrink-0 transition-transform duration-200',
                    isOpen && 'rotate-180',
                  )}
                />
              </button>

              {/* Submenus */}
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                )}
              >
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3 pb-1">
                  {item.children!.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-colors',
                          childActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                        )}
                      >
                        {child.icon && <span className="shrink-0">{child.icon}</span>}
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </nav>

      {/* Portal do cliente */}
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
