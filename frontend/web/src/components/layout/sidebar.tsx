'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Calendar, Receipt, DollarSign, Users, Repeat2,
  Building2, Package, UtensilsCrossed, LogOut, ChevronDown, ExternalLink,
  FileText, CheckSquare, BarChart2, TrendingUp, TrendingDown, Scale,
  Wallet, UserPlus, UserX, MapPin, UserCog, Scissors, Globe,
  PackagePlus, Coffee, CreditCard, ArrowUpRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const A = '#D4A24C';
const S = {
  bg:           '#0A0A0B',
  border:       'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.1)',
  text:         '#F4F4F5',
  textMuted:    '#A1A1AA',
  textDim:      '#71717A',
  hover:        'rgba(255,255,255,0.04)',
  active:       'rgba(255,255,255,0.06)',
};

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
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard', adminOnly: false },
  { label: 'Agenda',    icon: Calendar,        href: '/agenda',    adminOnly: false },
  {
    label: 'Caixa', icon: Receipt, adminOnly: true,
    children: [
      { label: 'Comandas abertas',  href: '/financeiro/comandas',          icon: <FileText size={13} /> },
      { label: 'Comandas fechadas', href: '/financeiro/comandas/fechadas', icon: <CheckSquare size={13} /> },
      { label: 'Relatórios',        href: '/financeiro/relatorios',        icon: <BarChart2 size={13} /> },
    ],
  },
  {
    label: 'Financeiro', icon: DollarSign, adminOnly: true,
    children: [
      { label: 'Comissões',           href: '/financeiro/comissoes',            icon: <TrendingUp size={13} /> },
      { label: 'Pagamento comissões', href: '/financeiro/comissoes/pagamentos', icon: <Wallet size={13} /> },
      { label: 'Balanço',             href: '/financeiro/balanco',              icon: <Scale size={13} /> },
      { label: 'Contas a pagar',      href: '/financeiro/contas-pagar',        icon: <TrendingDown size={13} /> },
      { label: 'Contas a receber',    href: '/financeiro/contas-receber',      icon: <Wallet size={13} /> },
      { label: 'Criar despesa',       href: '/financeiro/despesas',            icon: <TrendingDown size={13} /> },
      { label: 'Criar receita',       href: '/financeiro/receitas',            icon: <TrendingUp size={13} /> },
    ],
  },
  {
    label: 'Clientes', icon: Users, adminOnly: true,
    children: [
      { label: 'Cadastrar clientes',  href: '/clientes',            icon: <UserPlus size={13} /> },
      { label: 'Clientes bloqueados', href: '/clientes/bloqueados', icon: <UserX size={13} /> },
      { label: 'Relatórios',          href: '/clientes/relatorios', icon: <BarChart2 size={13} /> },
    ],
  },
  {
    label: 'Assinaturas', icon: Repeat2, adminOnly: true,
    children: [
      { label: 'Planos & Assinantes', href: '/assinaturas',            icon: <CreditCard size={13} /> },
      { label: 'Relatórios',          href: '/assinaturas/relatorios', icon: <BarChart2 size={13} /> },
      { label: 'Saque',               href: '/assinaturas/saque',      icon: <ArrowUpRight size={13} /> },
      { label: 'Conta Asaas',         href: '/financeiro/asaas',       icon: <Wallet size={13} /> },
    ],
  },
  {
    label: 'Barbearia', icon: Building2, adminOnly: true,
    children: [
      { label: 'Filiais',           href: '/barbearia/filiais', icon: <MapPin size={13} /> },
      { label: 'Profissionais',     href: '/barbeiros',         icon: <UserCog size={13} /> },
      { label: 'Serviços',          href: '/servicos',          icon: <Scissors size={13} /> },
      { label: 'Página do cliente', href: '/barbearia/portal',  icon: <Globe size={13} /> },
    ],
  },
  {
    label: 'Estoque', icon: Package, adminOnly: true,
    children: [
      { label: 'Produtos',   href: '/estoque',            icon: <PackagePlus size={13} /> },
      { label: 'Relatórios', href: '/estoque/relatorios', icon: <BarChart2 size={13} /> },
    ],
  },
  {
    label: 'Bar / Cozinha', icon: UtensilsCrossed, adminOnly: true,
    children: [
      { label: 'Produtos',   href: '/bar/produtos',   icon: <Coffee size={13} /> },
      { label: 'Relatórios', href: '/bar/relatorios', icon: <BarChart2 size={13} /> },
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
    <aside style={{
      width: 240, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
      background: S.bg, borderRight: `1px solid ${S.border}`,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${S.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/bzinho.png" alt="" style={{ width: 20, height: 20 * (183 / 148), objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 600, fontSize: 15.5, letterSpacing: '-0.02em', color: S.text }}>
            barberstack
          </span>
        </div>
        {user?.barbershop && (
          <p style={{ fontSize: 11, color: S.textDim, marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.barbershop.name}
          </p>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
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
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, fontWeight: isActive ? 500 : 400,
                  color: isActive ? A : S.textMuted,
                  background: isActive ? `${A}10` : 'transparent',
                  borderLeft: isActive ? `2px solid ${A}` : '2px solid transparent',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = S.text; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.textMuted; } }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleItem(item.label)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: isActive ? 500 : 400, textAlign: 'left',
                  color: isActive && !isOpen ? A : isActive ? S.text : S.textMuted,
                  background: isActive && !isOpen ? `${A}10` : isActive ? S.active : 'transparent',
                  borderLeft: isActive && !isOpen ? `2px solid ${A}` : '2px solid transparent',
                  fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = isActive ? S.active : S.hover; if (!isActive) e.currentTarget.style.color = S.text; }}
                onMouseLeave={e => { e.currentTarget.style.background = (isActive && !isOpen) ? `${A}10` : isActive ? S.active : 'transparent'; if (!isActive) e.currentTarget.style.color = S.textMuted; }}
              >
                <Icon size={15} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                <ChevronDown size={13} style={{ flexShrink: 0, transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {/* Children */}
              <div style={{
                overflow: 'hidden', transition: 'max-height 0.2s ease, opacity 0.2s',
                maxHeight: isOpen ? '500px' : '0', opacity: isOpen ? 1 : 0,
              }}>
                <div style={{
                  marginLeft: 24, marginTop: 2, marginBottom: 4,
                  paddingLeft: 12, borderLeft: `1px solid ${S.border}`,
                  display: 'flex', flexDirection: 'column', gap: 1,
                }}>
                  {item.children!.map((child) => {
                    const childActive = pathname === child.href || pathname.startsWith(child.href + '/');
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 8,
                          padding: '6px 8px', borderRadius: 6, textDecoration: 'none',
                          fontSize: 12, fontWeight: childActive ? 500 : 400,
                          color: childActive ? A : S.textDim,
                          background: childActive ? `${A}0E` : 'transparent',
                          transition: 'background 0.15s, color 0.15s',
                        }}
                        onMouseEnter={e => { if (!childActive) { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = S.textMuted; } }}
                        onMouseLeave={e => { if (!childActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.textDim; } }}
                      >
                        {child.icon && <span style={{ flexShrink: 0, color: 'inherit', display: 'flex' }}>{child.icon}</span>}
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

      {/* Portal link */}
      {user?.barbershop?.slug && (
        <div style={{ padding: '0 10px 6px' }}>
          <a
            href={`/${user.barbershop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
              fontSize: 12, color: S.textDim, transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = S.textMuted; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.textDim; }}
          >
            <ExternalLink size={13} style={{ flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Portal do cliente</span>
          </a>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: '12px 10px', borderTop: `1px solid ${S.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8 }}>
          {/* Avatar */}
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `${A}20`, border: `1px solid ${A}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: A,
          }}>
            {initials}
          </div>

          {/* Name + plan */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: S.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? '—'}
            </p>
            <p style={{ fontSize: 10.5, color: S.textDim, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.barbershop?.saasPlan
                ? (planLabel[user.barbershop.saasPlan] ?? user.barbershop.saasPlan)
                : (user?.role ?? '—')}
            </p>
          </div>

          <ThemeToggle />

          <button
            onClick={logout}
            title="Sair"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: S.textDim, display: 'flex', padding: 2, transition: 'color 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
            onMouseLeave={e => (e.currentTarget.style.color = S.textDim)}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
