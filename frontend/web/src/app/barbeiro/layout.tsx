import { BarberGuard } from '@/components/auth/barber-guard';
import { BarberSidebar } from '@/components/layout/barber-sidebar';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarberGuard>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0A0A0B' }}>
        <BarberSidebar />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
          {children}
        </main>
      </div>
    </BarberGuard>
  );
}
