import { KpiCard } from '@/components/dashboard/kpi-card';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { AppointmentOriginChart } from '@/components/dashboard/origin-chart';
import {
  Users,
  Scissors,
  TrendingUp,
  CreditCard,
  AlertTriangle,
  CalendarClock,
} from 'lucide-react';

// Em produção: buscar da API via server component ou react-query
const mockKpis = {
  professionals: 3,
  appointmentsMonth: 47,
  activeSubscriptions: 12,
  revenueMonth: 4850.0,
  openCommands: 2,
  defaulting: 1,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Visão geral da sua barbearia</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard
          title="Profissionais Ativos"
          value={mockKpis.professionals}
          icon={<Users className="h-5 w-5" />}
          description="Plano Prata: até 4"
        />
        <KpiCard
          title="Cortes este Mês"
          value={mockKpis.appointmentsMonth}
          icon={<Scissors className="h-5 w-5" />}
          description={`${mockKpis.appointmentsMonth}/400 do plano`}
          trend={{ value: 12, positive: true }}
        />
        <KpiCard
          title="Faturamento Mensal"
          value={`R$ ${mockKpis.revenueMonth.toFixed(2)}`}
          icon={<TrendingUp className="h-5 w-5" />}
          trend={{ value: 8, positive: true }}
        />
        <KpiCard
          title="Assinaturas Ativas"
          value={mockKpis.activeSubscriptions}
          icon={<CreditCard className="h-5 w-5" />}
          description="Clientes recorrentes"
        />
        <KpiCard
          title="Comandas Abertas"
          value={mockKpis.openCommands}
          icon={<CalendarClock className="h-5 w-5" />}
          variant="warning"
        />
        <KpiCard
          title="Inadimplentes"
          value={mockKpis.defaulting}
          icon={<AlertTriangle className="h-5 w-5" />}
          variant="danger"
          description="Assinaturas em atraso"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <AppointmentOriginChart />
        </div>
      </div>
    </div>
  );
}
