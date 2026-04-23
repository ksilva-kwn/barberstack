'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Menu } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <AuthGuard>
      <div
        className="flex h-screen overflow-hidden"
        style={{ background: 'hsl(var(--background))' }}
      >
        {/* ── Desktop sidebar: static flex child, never fixed ── */}
        <div className="hidden lg:flex h-full shrink-0">
          <Sidebar />
        </div>

        {/* ── Mobile: overlay + slide-in ── */}
        {mobileOpen && (
          <div className="lg:hidden">
            <div
              onClick={() => setMobileOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 30,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
              }}
            />
            <div style={{ position: 'fixed', inset: '0 auto 0 0', zIndex: 40 }}>
              <Sidebar onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <div
            className="lg:hidden flex items-center gap-3 px-4 shrink-0"
            style={{
              height: 52, borderBottom: '1px solid hsl(var(--border))',
              background: 'hsl(var(--sidebar))',
            }}
          >
            <button
              onClick={() => setMobileOpen(true)}
              style={{
                padding: 6, borderRadius: 8, background: 'none', border: 'none',
                cursor: 'pointer', color: 'hsl(var(--muted-foreground))', display: 'flex',
              }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/bzinho.png" alt="" style={{ width: 18, height: 18 * (183 / 148), objectFit: 'contain' }} />
              <span style={{
                fontFamily: "'Space Grotesk', 'Inter', sans-serif",
                fontWeight: 600, fontSize: 15, letterSpacing: '-0.02em',
                color: 'hsl(var(--foreground))',
              }}>
                barberstack
              </span>
            </div>
          </div>

          <main
            className="flex-1 overflow-y-auto"
            style={{ padding: '24px 28px' }}
          >
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
