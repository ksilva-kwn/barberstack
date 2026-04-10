'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, Clock, CreditCard, Banknote, Smartphone, Loader2, ChevronDown } from 'lucide-react';
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

const METHODS: PaymentMethod[] = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'];

function PaymentDropdown({ onPay }: { onPay: (method: PaymentMethod) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  const handleConfirm = () => {
    if (!selected) return;
    setOpen(false);
    onPay(selected);
    setSelected(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors"
      >
        <CheckCircle className="w-3.5 h-3.5" />
        Receber
        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSelected(null); }} />
          <div className="absolute right-0 bottom-9 z-20 bg-card border border-border rounded-lg shadow-xl py-2 min-w-[200px]">
            <p className="px-3 pb-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide border-b border-border mb-1">
              Forma de pagamento
            </p>
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setSelected(m)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors text-left',
                  selected === m
                    ? 'bg-primary/15 text-primary font-medium'
                    : 'text-foreground hover:bg-accent',
                )}
              >
                {PAYMENT_METHOD_ICON[m]}
                {PAYMENT_METHOD_LABEL[m]}
                {selected === m && <CheckCircle className="w-3 h-3 ml-auto" />}
              </button>
            ))}
            <div className="border-t border-border mt-1 px-2 pt-2">
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className="w-full py-1.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Fechar comanda
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function ComandasAbertasPage() {
  const queryClient = useQueryClient();

  const { data: appointments = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['comandas-abertas'],
    queryFn: () =>
      appointmentApi.list({ status: 'COMPLETED' }).then(r =>
        r.data.filter(a => a.paymentStatus === 'PENDING')
      ),
  });

  const payMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: PaymentMethod }) =>
      appointmentApi.updatePayment(id, 'PAID', method),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas-abertas'] });
      queryClient.invalidateQueries({ queryKey: ['comandas-fechadas'] });
    },
  });

  const totalPending = appointments.reduce((sum, a) => sum + Number(a.totalAmount), 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comandas abertas</h1>
        <p className="text-muted-foreground text-sm">Atendimentos finalizados aguardando pagamento</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-bold text-amber-400">
            R$ {totalPending.toFixed(2).replace('.', ',')}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-visible">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <CheckCircle className="w-8 h-8 opacity-30" />
            <p className="text-sm">Nenhuma comanda aberta</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Barbeiro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Serviços</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data / Hora</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {appointments.map((apt, i) => {
                const clientLabel = apt.client?.name ?? apt.clientName ?? 'Cliente';
                const barber = apt.professional?.nickname ?? apt.professional?.user?.name ?? '—';
                const services = apt.services.map(s => s.service.name).join(', ');
                const dt = new Date(apt.scheduledAt);

                return (
                  <tr
                    key={apt.id}
                    className={cn('border-b border-border/50 last:border-0', i % 2 === 0 ? '' : 'bg-muted/10')}
                  >
                    <td className="px-4 py-3 font-medium text-foreground">{clientLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground">{barber}</td>
                    <td className="px-4 py-3 text-muted-foreground max-w-[200px] truncate">{services}</td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {format(dt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      R$ {Number(apt.totalAmount).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <PaymentDropdown
                        onPay={(method) => payMutation.mutate({ id: apt.id, method })}
                      />
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
