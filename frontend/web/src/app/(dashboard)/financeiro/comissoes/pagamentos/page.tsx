'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2, CheckCircle2, Clock, Users, ChevronDown, X, DollarSign,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { financialApi, CommissionReport, CommissionPayment } from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

interface PayModalProps {
  pro: CommissionReport;
  year: number;
  month: number;
  existingPayment?: CommissionPayment;
  onClose: () => void;
  onSave: (notes: string) => Promise<void>;
  onUnmark: () => Promise<void>;
}

function PayModal({ pro, year, month, existingPayment, onClose, onSave, onUnmark }: PayModalProps) {
  const [notes, setNotes] = useState(existingPayment?.notes ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handle = async (fn: () => Promise<void>) => {
    setSubmitting(true);
    try { await fn(); onClose(); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {existingPayment?.isPaid ? 'Detalhes do pagamento' : 'Confirmar pagamento de comissão'}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">Barbeiro</span>
              <span className="text-sm font-medium text-foreground">{pro.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">Período</span>
              <span className="text-sm font-medium text-foreground">{MONTHS[month - 1]} / {year}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">Atendimentos</span>
              <span className="text-sm font-medium text-foreground">{pro.totalServices}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">Faturamento bruto</span>
              <span className="text-sm font-medium text-foreground">{fmt(pro.grossAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm text-muted-foreground">Comissão ({pro.commissionRate}%)</span>
              <span className="text-base font-bold text-primary">{fmt(pro.commissionAmount)}</span>
            </div>
            {existingPayment?.isPaid && existingPayment.paidAt && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-sm text-muted-foreground">Pago em</span>
                <span className="text-sm font-medium text-emerald-400">
                  {format(new Date(existingPayment.paidAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Observação (opcional)</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Ex: Pago via Pix em 16/04"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="flex gap-3">
            {existingPayment?.isPaid ? (
              <>
                <button
                  onClick={() => handle(onUnmark)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                >
                  Desmarcar como pago
                </button>
                <button
                  onClick={() => handle(() => onSave(notes))}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Atualizar
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={() => handle(() => onSave(notes))}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar pagamento
                </button>
              </>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function CommissionPaymentsPage() {
  const qc = useQueryClient();
  const [year, setYear]   = useState(currentYear);
  const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [proFilter, setProFilter] = useState('');
  const [modal, setModal] = useState<CommissionReport | null>(null);

  const monthStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  const monthEnd   = format(endOfMonth(new Date(year, month - 1)),   'yyyy-MM-dd');

  // Cálculo dinâmico do mês selecionado
  const { data: report = [], isLoading: loadingReport } = useQuery({
    queryKey: ['commissions-report', monthStart, monthEnd],
    queryFn: () => financialApi.commissions({ from: monthStart, to: monthEnd }).then(r => r.data),
  });

  // Registros de pagamento gravados
  const { data: payments = [], isLoading: loadingPayments } = useQuery({
    queryKey: ['commission-payments', year],
    queryFn: () => financialApi.commissionPayments({ year }).then(r => r.data),
  });

  const markMutation = useMutation({
    mutationFn: (data: Parameters<typeof financialApi.markCommissionPaid>[0]) =>
      financialApi.markCommissionPaid(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-payments', year] }),
  });

  const unmarkMutation = useMutation({
    mutationFn: (id: string) => financialApi.unmarkCommissionPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-payments', year] }),
  });

  const getPayment = (professionalId: string) =>
    payments.find(p => p.professionalId === professionalId && p.month === month);

  const isLoading = loadingReport || loadingPayments;

  // Profissionais filtrados
  const filtered = proFilter
    ? report.filter(r => r.name.toLowerCase().includes(proFilter.toLowerCase()))
    : report;

  const allPaid    = filtered.length > 0 && filtered.every(r => getPayment(r.professionalId)?.isPaid);
  const totalToPay = filtered.reduce((s, r) => s + r.commissionAmount, 0);

  const selectCls = 'px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pagamento de Comissões</h1>
        <p className="text-muted-foreground text-sm">Controle mensal de pagamentos por barbeiro</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <select value={year} onChange={e => setYear(parseInt(e.target.value))} className={selectCls}>
          {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(parseInt(e.target.value))} className={selectCls}>
          {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
        </select>
        <input
          className={selectCls + ' min-w-[180px]'}
          placeholder="Filtrar barbeiro..."
          value={proFilter}
          onChange={e => setProFilter(e.target.value)}
        />
      </div>

      {/* Resumo do mês */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Barbeiros no período</p>
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Total a pagar</p>
          <p className="text-2xl font-bold text-primary">{fmt(totalToPay)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Status</p>
          <p className={cn('text-xl font-bold', allPaid ? 'text-emerald-400' : 'text-amber-400')}>
            {allPaid ? 'Tudo pago' : `${filtered.filter(r => getPayment(r.professionalId)?.isPaid).length}/${filtered.length} pagos`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Users className="w-12 h-12 opacity-30 mb-4" />
          <p className="font-medium text-foreground">Nenhum atendimento pago em {MONTHS[month - 1]}/{year}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">BARBEIRO</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">ATENDIMENTOS</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">BRUTO</th>
                <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground">COMISSÃO</th>
                <th className="text-center px-5 py-3 text-xs font-medium text-muted-foreground">STATUS</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(pro => {
                const payment = getPayment(pro.professionalId);
                const paid    = payment?.isPaid ?? false;

                return (
                  <tr key={pro.professionalId} className="hover:bg-accent/10 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{pro.name}</p>
                          <p className="text-xs text-muted-foreground">{pro.commissionRate}%</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right text-foreground">{pro.totalServices}</td>
                    <td className="px-5 py-3 text-right text-muted-foreground hidden md:table-cell">{fmt(pro.grossAmount)}</td>
                    <td className="px-5 py-3 text-right font-bold text-primary">{fmt(pro.commissionAmount)}</td>
                    <td className="px-5 py-3 text-center">
                      {paid ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/25 text-xs font-medium">
                          <Clock className="w-3.5 h-3.5" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => setModal(pro)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                          paid
                            ? 'bg-muted/40 text-muted-foreground hover:bg-muted/60'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25',
                        )}
                      >
                        <DollarSign className="w-3.5 h-3.5 inline mr-1" />
                        {paid ? 'Ver detalhe' : 'Marcar pago'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <PayModal
          pro={modal}
          year={year}
          month={month}
          existingPayment={getPayment(modal.professionalId)}
          onClose={() => setModal(null)}
          onSave={async (notes) => {
            await markMutation.mutateAsync({
              professionalId:   modal.professionalId,
              year,
              month,
              totalServices:    modal.totalServices,
              grossAmount:      modal.grossAmount,
              commissionRate:   modal.commissionRate,
              commissionAmount: modal.commissionAmount,
              notes: notes || undefined,
            });
          }}
          onUnmark={async () => {
            const p = getPayment(modal.professionalId);
            if (p) await unmarkMutation.mutateAsync(p.id);
          }}
        />
      )}
    </div>
  );
}
