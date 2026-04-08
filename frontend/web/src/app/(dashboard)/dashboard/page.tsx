'use client';

import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { AppointmentOriginChart } from '@/components/dashboard/origin-chart';
import { useAuthStore } from '@/store/auth.store';
import { barbershopApi } from '@/lib/barbershop.api';
import { Users, Scissors, TrendingUp, CreditCard, AlertTriangle, CalendarClock, Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const barbershopId = user?.barbershopId ?? '';

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis', barbershopId],
    queryFn: () => barbershopApi.kpis(barbershopId).then((r) => r.data),
    enabled: !!barbershopId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da sua barbearia</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <KpiCard
              title="Profissionais Ativos"
              value={kpis?.professionals ?? '—'}
              icon={<Users className="h-5 w-5" />}
            />
            <KpiCard
              title="Cortes este Mês"
              value={kpis?.appointmentsMonth ?? '—'}
              icon={<Scissors className="h-5 w-5" />}
            />
            <KpiCard
              title="Faturamento Mensal"
              value={kpis ? `R$ ${(kpis.revenueMonth ?? 0).toFixed(2)}` : '—'}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <KpiCard
              title="Assinaturas Ativas"
              value={kpis?.activeSubscriptions ?? '—'}
              icon={<CreditCard className="h-5 w-5" />}
              description="Clientes recorrentes"
            />
            <KpiCard
              title="Comandas Abertas"
              value={kpis?.openCommands ?? '—'}
              icon={<CalendarClock className="h-5 w-5" />}
              variant="warning"
            />
            <KpiCard
              title="Inadimplentes"
              value={kpis?.defaulting ?? '—'}
              icon={<AlertTriangle className="h-5 w-5" />}
              variant="danger"
              description="Assinaturas em atraso"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <RevenueChart barbershopId={barbershopId} />
            </div>
            <div>
              <AppointmentOriginChart barbershopId={barbershopId} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
