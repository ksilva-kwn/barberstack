'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Calendar, CalendarOff, LogOut, LayoutGrid } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

const A = '#D4A24C';
const S = {
  bg:           '#0A0A0B',
  border:       'rgba(255,255,255,0.06)',
  text:         '#F4F4F5',
  textMuted:    '#A1A1AA',
  textDim:      '#71717A',
  hover:        'rgba(255,255,255,0.04)',
  active:       'rgba(255,255,255,0.06)',
};

const navItems = [
  { href: '/barbeiro/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/barbeiro/agenda',    label: 'Agenda',     icon: Calendar        },
  { href: '/barbeiro/folgas',    label: 'Folgas',     icon: CalendarOff     },
];

export function BarberSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { user, clearAuth } = useAuthStore();

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const logout = () => { clearAuth(); router.push('/login'); };

  return (
    <aside style={{
      width: 220, display: 'flex', flexDirection: 'column', height: '100%', flexShrink: 0,
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
        <p style={{ fontSize: 11, color: S.textDim, marginTop: 6 }}>Área do Barbeiro</p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
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
              <span style={{ flex: 1 }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin link */}
      {user?.role === 'ADMIN' && (
        <div style={{ padding: '0 10px 8px' }}>
          <Link
            href="/dashboard"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
              fontSize: 12, color: S.textDim, transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = S.hover; e.currentTarget.style.color = S.textMuted; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = S.textDim; }}
          >
            <LayoutGrid size={13} style={{ flexShrink: 0 }} />
            <span>Painel Admin</span>
          </Link>
        </div>
      )}

      {/* User footer */}
      <div style={{ padding: '12px 10px', borderTop: `1px solid ${S.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', borderRadius: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
            background: `${A}20`, border: `1px solid ${A}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, color: A,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 500, color: S.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name ?? '—'}
            </p>
            <p style={{ fontSize: 10.5, color: S.textDim, margin: '1px 0 0' }}>Barbeiro</p>
          </div>
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
