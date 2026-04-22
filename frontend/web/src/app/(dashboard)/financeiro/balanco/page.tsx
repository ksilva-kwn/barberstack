'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { TrendingUp, TrendingDown, DollarSign, Clock, Loader2, BarChart2, ShoppingCart } from 'lucide-react';
import { financialApi } from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const RANGES = [
  { label: 'Este mês',        months: 0 },
  { label: 'Mês passado',     months: 1 },
  { label: 'Últimos 3 meses', months: 3 },
  { label: 'Últimos 6 meses', months: 6 },
];

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function KpiCard({ label, value, sub, icon, color = 'default' }: {
  label: string; value: string; sub?: string; icon: React.ReactNode;
  color?: 'default' | 'green' | 'red' | 'amber' | 'blue';
}) {
  const c = {
    default: 'bg-primary/10 text-primary', green: 'bg-emerald-500/10 text-emerald-400',
    red: 'bg-destructive/10 text-destructive', amber: 'bg-amber-500/10 text-amber-400',
    blue: 'bg-sky-500/10 text-sky-400',
  }[color];
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c}`}>{icon}</div>
      </div>
    </div>
  );
}


export default function BalancoPage() {
  const [rangeIdx, setRangeIdx] = useState(0);
  const range = RANGES[rangeIdx];
  const now = new Date();

  const from = range.months === 0
    ? format(startOfMonth(now), 'yyyy-MM-dd')
    : format(startOfMonth(subMonths(now, range.months)), 'yyyy-MM-dd');
  const to = range.months === 1
    ? format(endOfMonth(subMonths(now, 1)), 'yyyy-MM-dd')
    : format(endOfMonth(now), 'yyyy-MM-dd');

  const { data: d, isLoading } = useQuery({
    queryKey: ['balance', from, to],
    queryFn: () => financialApi.balance(from, to).then(r => r.data),
  });

  if (isLoading || !d) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  const maxMonth = Math.max(...d.byMonth.map(m => Math.max(m.revenue, m.expenses)), 1);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Balanço</h1>
          <p className="text-muted-foreground text-sm">Receitas vs despesas do período</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 flex-wrap">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Receita total" value={fmt(d.totalRevenue)} sub={`${d.comandaQty} atendimentos`}
          icon={<TrendingUp className="w-4 h-4" />} color="green" />
        <KpiCard label="Despesas pagas" value={fmt(d.totalExpenses)} sub="lançamentos pagos"
          icon={<TrendingDown className="w-4 h-4" />} color="red" />
        <KpiCard label="Lucro líquido" value={fmt(d.netProfit)}
          sub={d.netProfit >= 0 ? 'resultado positivo' : 'resultado negativo'}
          icon={<DollarSign className="w-4 h-4" />}
          color={d.netProfit >= 0 ? 'green' : 'red'} />
        <KpiCard label="Pendências"
          value={fmt(d.pendingIncome - d.pendingExpense)}
          sub={`+${fmt(d.pendingIncome)} / -${fmt(d.pendingExpense)}`}
          icon={<Clock className="w-4 h-4" />} color="amber" />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Composição da receita</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Comandas pagas</span>
            <span className="font-semibold text-foreground">{fmt(d.comandaRevenue)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Receitas manuais</span>
            <span className="font-semibold text-foreground">{fmt(d.manualIncome)}</span>
          </div>
          <div className="border-t border-border pt-2 flex justify-between text-sm">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-bold text-emerald-400">{fmt(d.totalRevenue)}</span>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Despesas pagas</p>
          {d.totalExpenses === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma despesa no período.</p>
          ) : (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Lançamentos manuais</span>
                <span className="font-semibold text-foreground">{fmt(d.totalExpenses)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-sm">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-bold text-destructive">{fmt(d.totalExpenses)}</span>
              </div>
            </>
          )}
        </div>

        <div className={cn('rounded-xl p-5 border', d.netProfit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-destructive/10 border-destructive/20')}>
          <p className="text-xs uppercase tracking-wide mb-2 font-medium text-muted-foreground">Resultado</p>
          <p className={cn('text-4xl font-bold', d.netProfit >= 0 ? 'text-emerald-400' : 'text-destructive')}>
            {fmt(d.netProfit)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{d.netProfit >= 0 ? 'Lucro no período' : 'Prejuízo no período'}</p>
          {d.totalRevenue > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Margem: {((d.netProfit / d.totalRevenue) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      </div>

      {/* Gráfico mensal */}
      {d.byMonth.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Receita vs Despesa por mês</h2>
            <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500/60 inline-block" />Receita</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-destructive/60 inline-block" />Despesa</span>
            </div>
          </div>
          <div className="space-y-4">
            {d.byMonth.map(m => (
              <div key={m.month} className="space-y-1.5">
                <p className="text-xs text-muted-foreground font-medium">{m.month}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500/60 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((m.revenue / maxMonth) * 100, 100)}%` }} />
                  </div>
                  <span className="text-xs font-medium w-28 text-right shrink-0 text-foreground">{fmt(m.revenue)}</span>
                </div>
                {m.expenses > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-4 bg-muted/30 rounded-full overflow-hidden">
                      <div className="h-full bg-destructive/60 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min((m.expenses / maxMonth) * 100, 100)}%` }} />
                    </div>
                    <span className="text-xs font-medium w-28 text-right shrink-0 text-destructive">-{fmt(m.expenses)}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pendências */}
      {(d.pendingIncome > 0 || d.pendingExpense > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {d.pendingIncome > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-sky-500/10 border-sky-500/20 text-sky-400 text-sm">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-semibold">A receber: {fmt(d.pendingIncome)}</p>
                <p className="text-xs opacity-70">receitas com status pendente</p>
              </div>
            </div>
          )}
          {d.pendingExpense > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-400 text-sm">
              <Clock className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-semibold">A pagar: {fmt(d.pendingExpense)}</p>
                <p className="text-xs opacity-70">despesas com vencimento futuro</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
