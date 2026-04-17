'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { AppointmentOriginChart } from '@/components/dashboard/origin-chart';
import { useAuthStore } from '@/store/auth.store';
import { barbershopApi } from '@/lib/barbershop.api';
import { Users, Scissors, TrendingUp, CreditCard, AlertTriangle, CalendarClock, Loader2, SlidersHorizontal } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const barbershopId = user?.barbershopId ?? '';

  const [filterProfessionalId, setFilterProfessionalId] = useState('');
  const [filterBranchId, setFilterBranchId]             = useState('');
  const [filterMonths, setFilterMonths]                  = useState(6);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis', barbershopId, filterProfessionalId, filterBranchId],
    queryFn: () => barbershopApi.kpis(barbershopId, {
      professionalId: filterProfessionalId || undefined,
      branchId: filterBranchId || undefined,
    }).then((r) => r.data),
    enabled: !!barbershopId && !isSuperAdmin,
  });

  const { data: professionals } = useQuery({
    queryKey: ['professionals-list'],
    queryFn: () => barbershopApi.professionals().then((r) => r.data),
    enabled: !!barbershopId && !isSuperAdmin && user?.role === 'ADMIN',
  });

  const { data: branches } = useQuery({
    queryKey: ['branches-list', barbershopId],
    queryFn: () => barbershopApi.branches(barbershopId).then((r) => r.data),
    enabled: !!barbershopId && !isSuperAdmin && user?.role === 'ADMIN',
  });

  const isAdmin = user?.role === 'ADMIN';

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">SaaS Dashboard</h1>
          <p className="text-muted-foreground text-sm">Visão geral da plataforma Barberstack</p>
        </div>
        <div className="flex items-center justify-center py-20 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground font-medium">Bem-vindo, {user?.name}. As métricas gerais da plataforma estarão disponíveis em breve.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-display tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Visão geral da sua barbearia</p>
        </div>

        {/* Filters — admin only */}
        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground shrink-0" />

            {/* Barber filter */}
            {professionals && professionals.length > 0 && (
              <select
                value={filterProfessionalId}
                onChange={(e) => setFilterProfessionalId(e.target.value)}
                className="h-8 px-2 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Todos os barbeiros</option>
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname ?? p.user.name}
                  </option>
                ))}
              </select>
            )}

            {/* Branch filter */}
            {branches && branches.length > 1 && (
              <select
                value={filterBranchId}
                onChange={(e) => setFilterBranchId(e.target.value)}
                className="h-8 px-2 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Todas as filiais</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}

            {/* Period (months) filter for revenue chart */}
            <select
              value={filterMonths}
              onChange={(e) => setFilterMonths(Number(e.target.value))}
              className="h-8 px-2 text-xs bg-card border border-border rounded-md text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value={3}>Últimos 3 meses</option>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
            </select>
          </div>
        )}
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
              value={kpis ? `R$ ${(kpis.revenueMonth ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
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
              <RevenueChart
                barbershopId={barbershopId}
                professionalId={filterProfessionalId || undefined}
                branchId={filterBranchId || undefined}
                months={filterMonths}
              />
            </div>
            <div>
              <AppointmentOriginChart
                barbershopId={barbershopId}
                professionalId={filterProfessionalId || undefined}
                branchId={filterBranchId || undefined}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
