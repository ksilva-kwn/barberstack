'use client';

import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, CheckCircle, TrendingUp, DollarSign, Loader2, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { appointmentApi } from '@/lib/appointment.api';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function BarberDashboardPage() {
  const { user } = useAuthStore();
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  const { data: myProfessional, isLoading: loadingProf } = useQuery({
    queryKey: ['my-professional', user?.id],
    queryFn: () => api.get('/api/professionals').then(r =>
      r.data.find((p: any) => p.userId === user?.id)
    ),
    enabled: !!user,
  });

  const { data: todayApts = [] } = useQuery({
    queryKey: ['barber-appointments', todayStr, myProfessional?.id],
    queryFn: () => appointmentApi.list({ date: todayStr, professionalId: myProfessional?.id }).then(r => r.data),
    enabled: !!myProfessional,
  });

  const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
  const monthEnd   = format(endOfMonth(today),   'yyyy-MM-dd');

  const { data: monthApts = [] } = useQuery({
    queryKey: ['barber-appointments-month', myProfessional?.id, monthStart],
    queryFn: () => appointmentApi.list({ dateFrom: monthStart, dateTo: monthEnd, professionalId: myProfessional?.id }).then(r => r.data),
    enabled: !!myProfessional,
  });

  const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const weekEnd   = format(endOfWeek(today,   { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: weekApts = [] } = useQuery({
    queryKey: ['barber-appointments-week', myProfessional?.id, weekStart],
    queryFn: () => appointmentApi.list({ dateFrom: weekStart, dateTo: weekEnd, professionalId: myProfessional?.id }).then(r => r.data),
    enabled: !!myProfessional,
  });

  if (loadingProf) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!myProfessional) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Perfil de barbeiro não encontrado. Peça ao administrador para te cadastrar.
      </div>
    );
  }

  const todayPending   = todayApts.filter(a => ['SCHEDULED', 'CONFIRMED'].includes(a.status)).length;
  const todayDone      = todayApts.filter(a => a.status === 'COMPLETED').length;
  const todayInProg    = todayApts.filter(a => a.status === 'IN_PROGRESS').length;

  const monthCompleted = monthApts.filter(a => a.status === 'COMPLETED').length;
  const weekCompleted  = weekApts.filter(a =>  a.status === 'COMPLETED').length;

  const monthRevenue   = monthApts
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + Number(a.totalAmount), 0);

  const commissionRate = Number(myProfessional.commissionRate ?? 0);
  const myCommission   = (monthRevenue * commissionRate) / 100;

  const upcomingToday = todayApts
    .filter(a => ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'].includes(a.status))
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm capitalize">
          {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          label="Atendimentos hoje"
          value={todayApts.filter(a => !['CANCELED', 'NO_SHOW'].includes(a.status)).length}
          sub={`${todayDone} finalizado${todayDone !== 1 ? 's' : ''} · ${todayPending} aguardando`}
          icon={<Calendar className="w-5 h-5 text-blue-400" />}
          color="bg-blue-500/10"
        />
        <StatCard
          label="Esta semana"
          value={weekCompleted}
          sub="cortes finalizados"
          icon={<CheckCircle className="w-5 h-5 text-green-400" />}
          color="bg-green-500/10"
        />
        <StatCard
          label="Este mês"
          value={monthCompleted}
          sub="cortes finalizados"
          icon={<TrendingUp className="w-5 h-5 text-amber-400" />}
          color="bg-amber-500/10"
        />
        <StatCard
          label="Comissão do mês"
          value={`R$ ${myCommission.toFixed(2).replace('.', ',')}`}
          sub={commissionRate > 0 ? `${commissionRate}% de R$ ${monthRevenue.toFixed(2).replace('.', ',')}` : 'Taxa não configurada'}
          icon={<DollarSign className="w-5 h-5 text-purple-400" />}
          color="bg-purple-500/10"
        />
      </div>

      {/* Próximos hoje */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">
          {todayInProg > 0 ? 'Em atendimento + próximos de hoje' : 'Próximos de hoje'}
        </h2>
        {upcomingToday.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
            Nenhum atendimento pendente hoje.
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
            {upcomingToday.map(apt => {
              const time = new Date(apt.scheduledAt);
              const clientLabel = apt.client?.name ?? apt.clientName ?? 'Cliente';
              const serviceNames = apt.services?.map((s: any) => s.service.name).join(', ') ?? '';
              const statusColors: Record<string, string> = {
                SCHEDULED:   'text-blue-400',
                CONFIRMED:   'text-green-400',
                IN_PROGRESS: 'text-amber-400',
              };
              return (
                <div key={apt.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="text-center min-w-[40px]">
                    <p className="text-sm font-bold text-foreground">
                      {time.getHours().toString().padStart(2,'0')}:{time.getMinutes().toString().padStart(2,'0')}
                    </p>
                  </div>
                  <Clock className={`w-3.5 h-3.5 shrink-0 ${statusColors[apt.status] ?? 'text-muted-foreground'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{clientLabel}</p>
                    <p className="text-xs text-muted-foreground truncate">{serviceNames}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{apt.durationMins}min</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
