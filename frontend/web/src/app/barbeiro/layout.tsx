import { BarberGuard } from '@/components/auth/barber-guard';

export default function BarberLayout({ children }: { children: React.ReactNode }) {
  return (
    <BarberGuard>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </BarberGuard>
  );
}
