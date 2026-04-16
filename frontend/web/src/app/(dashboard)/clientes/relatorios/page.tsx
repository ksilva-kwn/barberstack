'use client';

import { useQuery } from '@tanstack/react-query';
import { barbershopApi } from '@/lib/barbershop.api';
import {
  Users, UserPlus, UserX, UserMinus, Trophy, TrendingUp,
  Calendar, Loader2, Star,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function KpiCard({ icon, label, value, sub, color = 'primary' }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'primary' | 'green' | 'red' | 'amber';
}) {
  const colorMap = {
    primary: 'bg-primary/10 text-primary',
    green:   'bg-emerald-500/10 text-emerald-400',
    red:     'bg-destructive/10 text-destructive',
    amber:   'bg-amber-500/10 text-amber-400',
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function BarChart({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) {
  return (
    <div className="space-y-2">
      {data.map(({ label, value }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground w-8 shrink-0 text-right">{label}</span>
          <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 rounded-full transition-all duration-500"
              style={{ width: maxValue > 0 ? `${(value / maxValue) * 100}%` : '0%' }}
            />
          </div>
          <span className="text-xs text-foreground font-medium w-6 shrink-0">{value}</span>
        </div>
      ))}
    </div>
  );
}

export default function ClientesRelatoriosPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['client-stats'],
    queryFn: () => barbershopApi.clientStats().then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) return null;

  const maxDow = Math.max(...stats.preferredDow.map(d => d.count), 1);
  const maxMonth = Math.max(...stats.newByMonth.map(m => m.count), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatório de Clientes</h1>
        <p className="text-muted-foreground text-sm">Análise do perfil e comportamento da sua base de clientes</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Users className="w-4 h-4" />}
          label="Clientes ativos"
          value={stats.totalActive}
          color="primary"
        />
        <KpiCard
          icon={<UserPlus className="w-4 h-4" />}
          label="Novos (30 dias)"
          value={stats.newLast30}
          sub="clientes cadastrados"
          color="green"
        />
        <KpiCard
          icon={<UserMinus className="w-4 h-4" />}
          label="Inativos (+60 dias)"
          value={stats.inactiveCount}
          sub="sem agendamento"
          color="amber"
        />
        <KpiCard
          icon={<UserX className="w-4 h-4" />}
          label="Bloqueados"
          value={stats.totalBlocked}
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Novos clientes por mês */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Novos clientes por mês</h2>
          </div>
          <BarChart
            data={stats.newByMonth.map(m => ({ label: m.month, value: m.count }))}
            maxValue={maxMonth}
          />
        </div>

        {/* Dia preferido */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Agendamentos por dia da semana</h2>
          </div>
          <BarChart
            data={stats.preferredDow.map(d => ({ label: d.day, value: d.count }))}
            maxValue={maxDow}
          />
        </div>
      </div>

      {/* Top clientes por visitas */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h2 className="font-semibold text-foreground text-sm">Clientes mais frequentes</h2>
        </div>
        {stats.topByVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-8 text-center">Nenhum dado disponível ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {stats.topByVisits.map((c, i) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === 0 ? 'bg-amber-500/20 text-amber-400' :
                  i === 1 ? 'bg-zinc-400/20 text-zinc-400' :
                  i === 2 ? 'bg-orange-700/20 text-orange-600' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {i + 1}
                </div>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {c.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    última visita: {format(new Date(c.lastVisit), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-foreground">{c.visits} visita{c.visits !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-muted-foreground">R$ {c.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top clientes por receita */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
          <Star className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Clientes por receita gerada</h2>
        </div>
        {stats.topByRevenue.length === 0 ? (
          <p className="text-sm text-muted-foreground px-5 py-8 text-center">Nenhum dado disponível ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {stats.topByRevenue.map((c, i) => {
              const maxRev = stats.topByRevenue[0]?.revenue ?? 1;
              return (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs text-muted-foreground w-4 shrink-0">{i + 1}.</span>
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    </div>
                    <p className="text-sm font-bold text-foreground shrink-0 ml-4">
                      R$ {c.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="h-1.5 bg-muted/30 rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${(c.revenue / maxRev) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Taxa de retenção estimada</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.totalActive > 0
              ? `${Math.round(((stats.totalActive - stats.inactiveCount) / stats.totalActive) * 100)}%`
              : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">clientes com visita nos últimos 60 dias</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Dia mais movimentado</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.preferredDow.reduce((a, b) => a.count > b.count ? a : b, { day: '—', count: 0 }).day}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">maior volume de agendamentos</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Média de visitas (top 10)</p>
          <p className="text-2xl font-bold text-foreground">
            {stats.topByVisits.length > 0
              ? (stats.topByVisits.reduce((s, c) => s + c.visits, 0) / stats.topByVisits.length).toFixed(1)
              : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">por cliente frequente</p>
        </div>
      </div>
    </div>
  );
}
