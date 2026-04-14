'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { TrendingUp, DollarSign, Users, Scissors, Loader2, BarChart2 } from 'lucide-react';
import { financialApi } from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const RANGES = [
  { label: 'Este mês',        months: 0 },
  { label: 'Últimos 3 meses', months: 3 },
  { label: 'Últimos 6 meses', months: 6 },
];

const fmt = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;

function HBar({ label, value, max, suffix, sub }: { label: string; value: number; max: number; suffix: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 shrink-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        {sub && <p className="text-[10px] text-muted-foreground/60">{sub}</p>}
      </div>
      <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
        <div className="h-full bg-primary/70 rounded-full transition-all duration-500"
          style={{ width: max > 0 ? `${Math.min((value / max) * 100, 100)}%` : '0%' }} />
      </div>
      <span className="text-xs font-medium text-foreground w-24 text-right shrink-0">{suffix}</span>
    </div>
  );
}

export default function RelatoriosFinanceiroPage() {
  const [rangeIdx, setRangeIdx] = useState(0);
  const range = RANGES[rangeIdx];
  const now = new Date();

  const from = range.months === 0
    ? format(startOfMonth(now), 'yyyy-MM-dd')
    : format(startOfMonth(subMonths(now, range.months)), 'yyyy-MM-dd');
  const to = format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: d, isLoading } = useQuery({
    queryKey: ['financial-report', from, to],
    queryFn: () => financialApi.report(from, to).then(r => r.data),
  });

  if (isLoading || !d) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  const maxMethod  = Math.max(...d.byMethod.map(m => m.total), 1);
  const maxPro     = Math.max(...d.byProfessional.map(p => p.total), 1);
  const maxService = Math.max(...d.byService.map(s => s.total), 1);
  const maxClient  = Math.max(...d.topClients.map(c => c.total), 1);
  const maxMonth   = Math.max(...d.monthlyRevenue.map(m => m.revenue), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground text-sm">Análise completa de receitas, serviços e clientes</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {RANGES.map((r, i) => (
            <button key={r.label} onClick={() => setRangeIdx(i)}
              className={cn('px-3 py-1 text-xs font-medium rounded transition-colors',
                rangeIdx === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Faturamento', value: fmt(d.totalRevenue), icon: <DollarSign className="w-4 h-4" />, color: 'green' },
          { label: 'Atendimentos', value: String(d.totalQty), icon: <Scissors className="w-4 h-4" />, color: 'blue' },
          { label: 'Ticket médio', value: fmt(d.ticketMedio), icon: <TrendingUp className="w-4 h-4" />, color: 'default' },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
                <p className="text-2xl font-bold text-foreground">{k.value}</p>
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', {
                green: 'bg-emerald-500/10 text-emerald-400', blue: 'bg-sky-500/10 text-sky-400', default: 'bg-primary/10 text-primary',
              }[k.color])}>{k.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por forma de pagamento */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Por forma de pagamento</h2>
          </div>
          {d.byMethod.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados no período.</p>
          ) : (
            <div className="space-y-2.5">
              {d.byMethod.map(m => (
                <HBar key={m.method} label={m.method} value={m.total} max={maxMethod}
                  suffix={fmt(m.total)} sub={`${m.qty} atend.`} />
              ))}
            </div>
          )}
        </div>

        {/* Por barbeiro */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Por barbeiro</h2>
          </div>
          {d.byProfessional.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados no período.</p>
          ) : (
            <div className="space-y-2.5">
              {d.byProfessional.map(p => (
                <HBar key={p.professionalId} label={p.name} value={p.total} max={maxPro}
                  suffix={fmt(p.total)} sub={`${p.qty} atend.`} />
              ))}
            </div>
          )}
        </div>

        {/* Serviços mais rentáveis */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Scissors className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Serviços mais rentáveis</h2>
          </div>
          {d.byService.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados no período.</p>
          ) : (
            <div className="space-y-2.5">
              {d.byService.map(s => (
                <HBar key={s.serviceName} label={s.serviceName} value={s.total} max={maxService}
                  suffix={fmt(s.total)} sub={`${s.qty}×`} />
              ))}
            </div>
          )}
        </div>

        {/* Top clientes */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Top clientes por receita</h2>
          </div>
          {d.topClients.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem dados no período.</p>
          ) : (
            <div className="space-y-2.5">
              {d.topClients.map(c => (
                <HBar key={c.clientName} label={c.clientName} value={c.total} max={maxClient}
                  suffix={fmt(c.total)} sub={`${c.qty} visita(s)`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receita mensal */}
      {d.monthlyRevenue.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Faturamento por mês</h2>
          </div>
          <div className="space-y-2.5">
            {d.monthlyRevenue.map(m => (
              <HBar key={m.month} label={m.month} value={m.revenue} max={maxMonth}
                suffix={`${m.qty} atend. · ${fmt(m.revenue)}`} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
