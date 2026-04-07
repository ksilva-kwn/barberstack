import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-background overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}
