'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { TrendingUp, DollarSign, Users, Scissors, Loader2 } from 'lucide-react';
import { appointmentApi, Appointment, PaymentMethod } from '@/lib/appointment.api';
import { cn } from '@/lib/utils';

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX:         'Pix',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD:  'Cartão de Débito',
  CASH:        'Dinheiro',
  BOLETO:      'Boleto',
};

const RANGE_OPTIONS = [
  { label: 'Este mês', dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'), dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd') },
  { label: 'Últimos 7 dias', dateFrom: format(subDays(new Date(), 7), 'yyyy-MM-dd'), dateTo: format(new Date(), 'yyyy-MM-dd') },
  { label: 'Últimos 30 dias', dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'), dateTo: format(new Date(), 'yyyy-MM-dd') },
];

export default function RelatoriosPage() {
  const [rangeIdx, setRangeIdx] = useState(0);
  const range = RANGE_OPTIONS[rangeIdx];

  const { data: all = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['relatorios', rangeIdx],
    queryFn: () =>
      appointmentApi.list({ dateFrom: range.dateFrom, dateTo: range.dateTo }).then(r => r.data),
  });

  const completed   = all.filter(a => a.status === 'COMPLETED');
  const paid        = completed.filter(a => a.paymentStatus === 'PAID');
  const pending     = completed.filter(a => a.paymentStatus === 'PENDING');
  const canceled    = all.filter(a => a.status === 'CANCELED' || a.status === 'NO_SHOW');

  const totalRevenue = paid.reduce((s, a) => s + Number(a.totalAmount), 0);
  const totalPending = pending.reduce((s, a) => s + Number(a.totalAmount), 0);

  // Revenue por forma de pagamento
  const byMethod = paid.reduce<Record<string, number>>((acc, a) => {
    const m = a.paymentMethod ?? 'Outros';
    acc[m] = (acc[m] ?? 0) + Number(a.totalAmount);
    return acc;
  }, {});

  // Revenue por barbeiro
  const byBarber = paid.reduce<Record<string, { name: string; count: number; total: number }>>((acc, a) => {
    const id = a.professionalId;
    const name = a.professional?.nickname ?? a.professional?.user?.name ?? id;
    if (!acc[id]) acc[id] = { name, count: 0, total: 0 };
    acc[id].count++;
    acc[id].total += Number(a.totalAmount);
    return acc;
  }, {});

  const barbers = Object.values(byBarber).sort((a, b) => b.total - a.total);

  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground text-sm">Visão geral financeira do período</p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {RANGE_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => setRangeIdx(i)}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded transition-colors',
                rangeIdx === i ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Receita recebida</p>
              </div>
              <p className="text-2xl font-bold text-emerald-400">{fmt(totalRevenue)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">A receber</p>
              </div>
              <p className="text-2xl font-bold text-amber-400">{fmt(totalPending)}</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scissors className="w-4 h-4 text-sky-400" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Atendimentos</p>
              </div>
              <p className="text-2xl font-bold text-foreground">{completed.length}</p>
              {canceled.length > 0 && (
                <p className="text-xs text-muted-foreground">{canceled.length} cancelados</p>
              )}
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ticket médio</p>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {paid.length > 0 ? fmt(totalRevenue / paid.length) : 'R$ 0,00'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Por forma de pagamento */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-foreground mb-4">Receita por forma de pagamento</h2>
              {Object.keys(byMethod).length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum pagamento no período</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(byMethod)
                    .sort((a, b) => b[1] - a[1])
                    .map(([method, total]) => {
                      const pct = totalRevenue > 0 ? (total / totalRevenue) * 100 : 0;
                      return (
                        <div key={method}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">
                              {PAYMENT_METHOD_LABEL[method as PaymentMethod] ?? method}
                            </span>
                            <span className="text-xs font-medium text-foreground">{fmt(total)}</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Por barbeiro */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h2 className="text-sm font-semibold text-foreground mb-4">Receita por barbeiro</h2>
              {barbers.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhum atendimento pago no período</p>
              ) : (
                <div className="space-y-3">
                  {barbers.map((b) => {
                    const pct = totalRevenue > 0 ? (b.total / totalRevenue) * 100 : 0;
                    return (
                      <div key={b.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">{b.name} <span className="opacity-60">({b.count}x)</span></span>
                          <span className="text-xs font-medium text-foreground">{fmt(b.total)}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
