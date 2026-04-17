'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  Receipt,
  DollarSign,
  Users,
  Repeat2,
  Building2,
  Package,
  UtensilsCrossed,
  Settings,
  LogOut,
  ChevronDown,
  ExternalLink,
  FileText,
  CheckSquare,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet,
  UserPlus,
  UserX,
  MapPin,
  UserCog,
  Scissors,
  Globe,
  PackagePlus,
  Coffee,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface SubItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  href?: string;
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
    label: 'Caixa',
    icon: Receipt,
    adminOnly: true,
    children: [
      { label: 'Comandas abertas',  href: '/financeiro/comandas',          icon: <FileText className="w-3.5 h-3.5" /> },
      { label: 'Comandas fechadas', href: '/financeiro/comandas/fechadas', icon: <CheckSquare className="w-3.5 h-3.5" /> },
      { label: 'Relatórios',        href: '/financeiro/relatorios',        icon: <BarChart2 className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Financeiro',
    icon: DollarSign,
    adminOnly: true,
    children: [
      { label: 'Comissões',           href: '/financeiro/comissoes',            icon: <TrendingUp className="w-3.5 h-3.5" /> },
      { label: 'Pagamento comissões', href: '/financeiro/comissoes/pagamentos', icon: <Wallet className="w-3.5 h-3.5" /> },
      { label: 'Balanço',             href: '/financeiro/balanco',              icon: <Scale className="w-3.5 h-3.5" /> },
      { label: 'Contas a pagar',      href: '/financeiro/contas-pagar',        icon: <TrendingDown className="w-3.5 h-3.5" /> },
      { label: 'Contas a receber',    href: '/financeiro/contas-receber',      icon: <Wallet className="w-3.5 h-3.5" /> },
      { label: 'Criar despesa',       href: '/financeiro/despesas',            icon: <TrendingDown className="w-3.5 h-3.5" /> },
      { label: 'Criar receita',       href: '/financeiro/receitas',            icon: <TrendingUp className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Clientes',
    icon: Users,
    adminOnly: true,
    children: [
      { label: 'Cadastrar clientes',    href: '/clientes',            icon: <UserPlus className="w-3.5 h-3.5" /> },
      { label: 'Clientes bloqueados',   href: '/clientes/bloqueados', icon: <UserX className="w-3.5 h-3.5" /> },
      { label: 'Relatórios',            href: '/clientes/relatorios', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Assinaturas',
    icon: Repeat2,
    href: '/assinaturas',
    adminOnly: true,
  },
  {
    label: 'Barbearia',
    icon: Building2,
    adminOnly: true,
    children: [
      { label: 'Filiais',           href: '/barbearia/filiais',  icon: <MapPin className="w-3.5 h-3.5" /> },
      { label: 'Profissionais',     href: '/barbeiros',          icon: <UserCog className="w-3.5 h-3.5" /> },
      { label: 'Serviços',          href: '/servicos',           icon: <Scissors className="w-3.5 h-3.5" /> },
      { label: 'Página do cliente', href: '/barbearia/portal',   icon: <Globe className="w-3.5 h-3.5" /> },
      { label: 'Configurações',     href: '/configuracoes',      icon: <Settings className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Estoque',
    icon: Package,
    adminOnly: true,
    children: [
      { label: 'Produtos',    href: '/estoque',           icon: <PackagePlus className="w-3.5 h-3.5" /> },
      { label: 'Relatórios',  href: '/estoque/relatorios', icon: <BarChart2 className="w-3.5 h-3.5" /> },
    ],
  },
  {
    label: 'Bar / Cozinha',
    icon: UtensilsCrossed,
    adminOnly: true,
    children: [
      { label: 'Produtos',   href: '/bar/produtos',    icon: <Coffee className="w-3.5 h-3.5" /> },
      { label: 'Relatórios', href: '/bar/relatorios',  icon: <BarChart2 className="w-3.5 h-3.5" /> },
    ],
  },
];

const planLabel: Record<string, string> = {
  BRONZE: 'Plano Bronze',
  PRATA:  'Plano Prata',
  OURO:   'Plano Ouro',
};

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const initialOpen = navItems
    .filter(item => item.children?.some(c => pathname.startsWith(c.href)))
    .map(item => item.label);

  const [openItems, setOpenItems] = useState<string[]>(initialOpen);

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
    <aside className="w-64 flex flex-col h-full shrink-0 border-r border-border" style={{ backgroundColor: 'hsl(var(--sidebar))' }}>
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0" style={{ boxShadow: '0 4px 12px hsl(var(--primary) / 0.4)' }}>
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-base text-foreground font-display tracking-tight">Barberstack</span>
        </div>
        {user?.barbershop && (
          <p className="text-xs text-muted-foreground mt-1.5 truncate">{user.barbershop.name}</p>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-0.5 overflow-y-auto">
        {filtered.map((item) => {
          const Icon = item.icon;
          const hasChildren = !!item.children?.length;
          const isOpen = openItems.includes(item.label);

          const isActive = item.href
            ? pathname === item.href || pathname.startsWith(item.href + '/')
            : item.children?.some(c => pathname === c.href || pathname.startsWith(c.href + '/')) ?? false;

          if (!hasChildren && item.href) {
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
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

              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0',
                )}
              >
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-3 pb-1">
                  {item.children!.map((child) => {
                    const childActive = pathname === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
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
      <div className="p-4 border-t border-white/10">
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
          <ThemeToggle />
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
