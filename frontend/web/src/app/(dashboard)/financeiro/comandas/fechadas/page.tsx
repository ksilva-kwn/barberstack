'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, CreditCard, Banknote, Smartphone, Loader2, RotateCcw } from 'lucide-react';
import { appointmentApi, Appointment, PaymentMethod } from '@/lib/appointment.api';
import { cn } from '@/lib/utils';

const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX:         'Pix',
  CREDIT_CARD: 'Cartão de Crédito',
  DEBIT_CARD:  'Cartão de Débito',
  CASH:        'Dinheiro',
  BOLETO:      'Boleto',
};

const PAYMENT_METHOD_ICON: Record<PaymentMethod, React.ReactNode> = {
  PIX:         <Smartphone className="w-3.5 h-3.5" />,
  CREDIT_CARD: <CreditCard className="w-3.5 h-3.5" />,
  DEBIT_CARD:  <CreditCard className="w-3.5 h-3.5" />,
  CASH:        <Banknote className="w-3.5 h-3.5" />,
  BOLETO:      <Banknote className="w-3.5 h-3.5" />,
};

const METHOD_STYLE: Record<PaymentMethod, string> = {
  PIX:         'bg-sky-500/15 text-sky-400 border-sky-500/30',
  CREDIT_CARD: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  DEBIT_CARD:  'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  CASH:        'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  BOLETO:      'bg-amber-500/15 text-amber-400 border-amber-500/30',
};

const RANGE_OPTIONS = [
  { label: 'Hoje',        days: 0 },
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
];

export default function ComandasFechadasPage() {
  const queryClient = useQueryClient();
  const [rangeIdx, setRangeIdx] = useState(1);
  const range = RANGE_OPTIONS[rangeIdx];

  const dateFrom = format(subDays(new Date(), range.days), 'yyyy-MM-dd');
  const dateTo   = format(new Date(), 'yyyy-MM-dd');

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['comandas-fechadas', rangeIdx],
    queryFn: () =>
      appointmentApi.list({ dateFrom, dateTo, status: 'COMPLETED' }).then(r =>
        r.data.filter(a => a.paymentStatus === 'PAID')
      ),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.updatePayment(id, 'PENDING'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas-fechadas'] });
      queryClient.invalidateQueries({ queryKey: ['comandas-abertas'] });
    },
  });

  const totalPaid = appointments.reduce((sum, a) => sum + Number(a.totalAmount), 0);

  // Breakdown por forma de pagamento
  const byMethod = appointments.reduce<Record<string, { count: number; total: number }>>((acc, a) => {
    const m = a.paymentMethod ?? 'Outros';
    if (!acc[m]) acc[m] = { count: 0, total: 0 };
    acc[m].count++;
    acc[m].total += Number(a.totalAmount);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comandas fechadas</h1>
          <p className="text-muted-foreground text-sm">Atendimentos já pagos</p>
        </div>
        {/* Range selector */}
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Atendimentos</p>
          <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total recebido</p>
          <p className="text-2xl font-bold text-emerald-400">
            R$ {totalPaid.toFixed(2).replace('.', ',')}
          </p>
        </div>
        {Object.entries(byMethod).slice(0, 2).map(([method, data]) => (
          <div key={method} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {PAYMENT_METHOD_LABEL[method as PaymentMethod] ?? method}
            </p>
            <p className="text-lg font-bold text-foreground">{data.count}</p>
            <p className="text-xs text-muted-foreground">R$ {data.total.toFixed(2).replace('.', ',')}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <CheckCircle className="w-8 h-8 opacity-30" />
            <p className="text-sm">Nenhuma comanda fechada no período</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Barbeiro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Serviços</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Pagamento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Pago em</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt, i) => {
                const clientLabel = apt.client?.name ?? apt.clientName ?? 'Cliente';
                const barber = apt.professional?.nickname ?? apt.professional?.user?.name ?? '—';
                const services = apt.services.map(s => s.service.name).join(', ');
                const paidAt = apt.paidAt ? new Date(apt.paidAt) : null;
                const method = apt.paymentMethod as PaymentMethod | null;

                return (
                  <tr
                    key={apt.id}
                    className={cn('border-b border-border/50 last:border-0', i % 2 === 0 ? '' : 'bg-muted/10')}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{clientLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground">{barber}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{services}</td>
                    <td className="px-4 py-3">
                      {method ? (
                        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-medium', METHOD_STYLE[method])}>
                          {PAYMENT_METHOD_ICON[method]}
                          {PAYMENT_METHOD_LABEL[method]}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap text-xs">
                      {paidAt ? format(paidAt, "dd/MM/yy HH:mm", { locale: ptBR }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      R$ {Number(apt.totalAmount).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => reopenMutation.mutate(apt.id)}
                        title="Reabrir comanda"
                        className="p-1.5 rounded text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
