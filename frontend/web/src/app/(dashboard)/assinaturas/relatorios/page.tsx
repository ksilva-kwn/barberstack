'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Users, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { subscriptionApi } from '@/lib/subscription.api';

function useIsDark() {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark')),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function AssinaturasRelatoriosPage() {
  const dark = useIsDark();
  const { data: reports, isLoading } = useQuery({
    queryKey: ['subscription-reports'],
    queryFn: () => subscriptionApi.reports().then(r => r.data),
  });

  const grid       = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const tick       = dark ? '#6b7280' : '#9ca3af';
  const tooltipBg  = dark ? '#1e1e1e' : '#ffffff';
  const tooltipBdr = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const tooltipClr = dark ? '#f3f4f6' : '#111827';
  const barColor   = 'hsl(38, 65%, 52%)';

  const kpis = [
    {
      label: 'MRR',
      desc: 'Receita mensal recorrente',
      value: `R$ ${(reports?.mrr ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      icon: <TrendingUp className="w-5 h-5" />,
      cls: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Assinantes Ativos',
      desc: 'Pagamentos em dia',
      value: reports?.activeCount ?? '—',
      icon: <Users className="w-5 h-5" />,
      cls: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Inadimplentes',
      desc: 'Pagamentos em atraso',
      value: reports?.defaultingCount ?? '—',
      icon: <AlertTriangle className="w-5 h-5" />,
      cls: 'text-yellow-500',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Cancelamentos',
      desc: 'Este mês',
      value: reports?.canceledThisMonth ?? '—',
      icon: <XCircle className="w-5 h-5" />,
      cls: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Relatórios de Assinaturas</h1>
        <p className="text-muted-foreground text-sm">Visão financeira dos planos recorrentes</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {kpis.map(k => (
              <div key={k.label} className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className={`w-10 h-10 rounded-xl ${k.bg} ${k.cls} flex items-center justify-center`}>
                  {k.icon}
                </div>
                <div>
                  <p className={`text-3xl font-bold tracking-tight ${k.cls}`}>{k.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">{k.label}</p>
                  <p className="text-xs text-muted-foreground">{k.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Receita por mês */}
            <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Receita Recorrente por Mês</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={reports?.revenueByMonth ?? []} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: tick, fontSize: 11 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBdr}`, borderRadius: 8 }}
                    labelStyle={{ color: tooltipClr }}
                    formatter={(v: number) => [`R$ ${(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'Receita']}
                  />
                  <Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={48}>
                    {(reports?.revenueByMonth ?? []).map((_, i, arr) => (
                      <Cell
                        key={i}
                        fill={i === arr.length - 1 ? barColor : `${barColor}55`}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top planos */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-4">Top Planos</h3>
              {(reports?.topPlans ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponível</p>
              ) : (
                <div className="space-y-3">
                  {(reports?.topPlans ?? []).map(p => (
                    <div key={p.planId} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{p.planName}</p>
                        <p className="text-xs text-muted-foreground">{p.count} assinante{p.count !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold text-primary">
                          R$ {p.mrr.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground">MRR</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Taxa de inadimplência */}
          {(reports?.activeCount ?? 0) + (reports?.defaultingCount ?? 0) > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-semibold text-foreground mb-3">Taxa de Inadimplência</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-yellow-500 transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        ((reports?.defaultingCount ?? 0) /
                          ((reports?.activeCount ?? 0) + (reports?.defaultingCount ?? 0))) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-semibold text-yellow-500 shrink-0">
                  {Math.round(
                    ((reports?.defaultingCount ?? 0) /
                      ((reports?.activeCount ?? 0) + (reports?.defaultingCount ?? 0))) * 100,
                  )}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {reports?.defaultingCount} de {(reports?.activeCount ?? 0) + (reports?.defaultingCount ?? 0)} assinantes com pagamento em atraso
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
