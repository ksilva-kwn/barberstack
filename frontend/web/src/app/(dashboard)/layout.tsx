'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { Menu } from 'lucide-react';

const S = {
  bg:     '#0A0A0B',
  border: 'rgba(255,255,255,0.06)',
  text:   '#F4F4F5',
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: S.bg }}>

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 30,
              background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            }}
            className="lg:hidden"
          />
        )}

        {/* Sidebar */}
        <div
          className="lg:relative lg:translate-x-0 lg:z-auto"
          style={{
            position: 'fixed', inset: '0 auto 0 0', zIndex: 40,
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            transition: 'transform 0.25s ease',
          }}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main content area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
          {/* Mobile top bar */}
          <div
            className="lg:hidden"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px', flexShrink: 0,
              borderBottom: `1px solid ${S.border}`,
              background: S.bg,
            }}
          >
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                padding: 6, borderRadius: 8, background: 'none', border: 'none',
                cursor: 'pointer', color: '#71717A', display: 'flex',
              }}
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/bzinho.png" alt="" style={{ width: 20, height: 20 * (183 / 148), objectFit: 'contain' }} />
              <span style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 600, fontSize: 15, letterSpacing: '-0.02em', color: S.text }}>
                barberstack
              </span>
            </div>
          </div>

          <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
