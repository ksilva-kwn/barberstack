import { BarberGuard } from '@/components/auth/barber-guard';
import { BarberSidebar } from '@/components/layout/barber-sidebar';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarberGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        <BarberSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </BarberGuard>
  );
}
