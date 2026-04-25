'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2, CheckCircle2, Clock, Users, X, DollarSign, Crown,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  financialApi, CommissionPayment, PlanCommissionPayment,
} from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => currentYear - i);

interface MergedRow {
  professionalId: string;
  name: string;
  avulsoServices: number;
  avulsoGross: number;
  avulsoRate: number;
  avulsoCommission: number;
  avulsoPayment?: CommissionPayment;
  planServices: number;
  planCommission: number;
  planPayment?: PlanCommissionPayment;
  total: number;
}

interface PayModalProps {
  row: MergedRow;
  year: number;
  month: number;
  onClose: () => void;
  onSaveAvulso: (notes: string) => Promise<void>;
  onUnmarkAvulso: () => Promise<void>;
  onSavePlan: (notes: string) => Promise<void>;
  onUnmarkPlan: () => Promise<void>;
}

function PayModal({ row, year, month, onClose, onSaveAvulso, onUnmarkAvulso, onSavePlan, onUnmarkPlan }: PayModalProps) {
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const avulsoPaid = row.avulsoPayment?.isPaid ?? false;
  const planPaid   = row.planPayment?.isPaid   ?? false;
  const bothPaid   = avulsoPaid && planPaid;
  const nothingNew = (row.avulsoCommission === 0 || avulsoPaid) && (row.planCommission === 0 || planPaid);

  const handle = async (fn: () => Promise<void>) => {
    setSubmitting(true);
    try { await fn(); onClose(); }
    finally { setSubmitting(false); }
  };

  const handleConfirm = () => handle(async () => {
    if (row.avulsoCommission > 0 && !avulsoPaid) await onSaveAvulso(notes);
    if (row.planCommission   > 0 && !planPaid)   await onSavePlan(notes);
  });

  const handleUnmarkAll = () => handle(async () => {
    if (avulsoPaid) await onUnmarkAvulso();
    if (planPaid)   await onUnmarkPlan();
  });

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {bothPaid ? 'Detalhes do pagamento' : 'Confirmar pagamento de comissão'}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">Barbeiro</span>
              <span className="text-sm font-medium text-foreground">{row.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <span className="text-sm text-muted-foreground">Período</span>
              <span className="text-sm font-medium text-foreground">{MONTHS[month - 1]} / {year}</span>
            </div>

            {/* Avulso breakdown */}
            {row.avulsoCommission > 0 && (
              <div className={cn('rounded-lg border p-3 space-y-2',
                avulsoPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/20 border-border')}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comissão avulsa</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Atendimentos</span>
                  <span className="text-foreground">{row.avulsoServices}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bruto</span>
                  <span className="text-foreground">{fmt(row.avulsoGross)}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Comissão ({row.avulsoRate}%)</span>
                  <span className={avulsoPaid ? 'text-emerald-400' : 'text-primary'}>{fmt(row.avulsoCommission)}</span>
                </div>
                {avulsoPaid && row.avulsoPayment?.paidAt && (
                  <p className="text-xs text-emerald-400">
                    Pago em {format(new Date(row.avulsoPayment.paidAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}

            {/* Plan breakdown */}
            {row.planCommission > 0 && (
              <div className={cn('rounded-lg border p-3 space-y-2',
                planPaid ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-muted/20 border-border')}>
                <div className="flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Comissão plano</p>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Atendimentos de plano</span>
                  <span className="text-foreground">{row.planServices}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-muted-foreground">Comissão</span>
                  <span className={planPaid ? 'text-emerald-400' : 'text-amber-400'}>{fmt(row.planCommission)}</span>
                </div>
                {planPaid && row.planPayment?.paidAt && (
                  <p className="text-xs text-emerald-400">
                    Pago em {format(new Date(row.planPayment.paidAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                )}
              </div>
            )}

            {/* Total */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
              <span className="text-sm font-semibold text-foreground">Total</span>
              <span className="text-base font-bold text-primary">{fmt(row.total)}</span>
            </div>
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
            {bothPaid ? (
              <>
                <button
                  onClick={() => handle(handleUnmarkAll)}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                >
                  Desmarcar como pago
                </button>
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                  Fechar
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting || nothingNew}
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
  const [year, setYear]     = useState(currentYear);
  const [month, setMonth]   = useState(new Date().getMonth() + 1);
  const [proFilter, setProFilter] = useState('');
  const [modal, setModal]   = useState<MergedRow | null>(null);

  const monthStart = format(startOfMonth(new Date(year, month - 1)), 'yyyy-MM-dd');
  const monthEnd   = format(endOfMonth(new Date(year, month - 1)),   'yyyy-MM-dd');

  const { data: avulsoReport = [], isLoading: loadingAvulso } = useQuery({
    queryKey: ['commissions-report', monthStart, monthEnd],
    queryFn: () => financialApi.commissions({ from: monthStart, to: monthEnd }).then(r => r.data),
  });

  const { data: avulsoPayments = [], isLoading: loadingAvulsoPayments } = useQuery({
    queryKey: ['commission-payments', year],
    queryFn: () => financialApi.commissionPayments({ year }).then(r => r.data),
  });

  const { data: planReport, isLoading: loadingPlan } = useQuery({
    queryKey: ['plan-commissions-report', monthStart, monthEnd],
    queryFn: () => financialApi.planCommissions({ from: monthStart, to: monthEnd }).then(r => r.data),
  });

  const { data: planPayments = [], isLoading: loadingPlanPayments } = useQuery({
    queryKey: ['plan-commission-payments', year],
    queryFn: () => financialApi.planCommissionPayments({ year }).then(r => r.data),
  });

  const markAvulso = useMutation({
    mutationFn: (data: Parameters<typeof financialApi.markCommissionPaid>[0]) =>
      financialApi.markCommissionPaid(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-payments', year] }),
  });

  const unmarkAvulso = useMutation({
    mutationFn: (id: string) => financialApi.unmarkCommissionPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commission-payments', year] }),
  });

  const markPlan = useMutation({
    mutationFn: (data: Parameters<typeof financialApi.markPlanCommissionPaid>[0]) =>
      financialApi.markPlanCommissionPaid(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan-commission-payments', year] }),
  });

  const unmarkPlan = useMutation({
    mutationFn: (id: string) => financialApi.unmarkPlanCommissionPaid(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan-commission-payments', year] }),
  });

  // Merge avulso + plan by professionalId
  const merged: MergedRow[] = (() => {
    const map = new Map<string, MergedRow>();

    for (const pro of avulsoReport) {
      map.set(pro.professionalId, {
        professionalId: pro.professionalId,
        name: pro.name,
        avulsoServices: pro.totalServices,
        avulsoGross: pro.grossAmount,
        avulsoRate: pro.commissionRate,
        avulsoCommission: pro.commissionAmount,
        avulsoPayment: avulsoPayments.find(p => p.professionalId === pro.professionalId && p.month === month),
        planServices: 0,
        planCommission: 0,
        planPayment: undefined,
        total: pro.commissionAmount,
      });
    }

    for (const pro of (planReport?.professionals ?? [])) {
      const existing = map.get(pro.professionalId);
      const planPay = planPayments.find(p => p.professionalId === pro.professionalId && p.month === month);
      if (existing) {
        existing.planServices   = pro.totalSubscriptionServices;
        existing.planCommission = pro.commissionAmount;
        existing.planPayment    = planPay;
        existing.total          = existing.avulsoCommission + pro.commissionAmount;
      } else {
        map.set(pro.professionalId, {
          professionalId: pro.professionalId,
          name: pro.name,
          avulsoServices: 0,
          avulsoGross: 0,
          avulsoRate: 0,
          avulsoCommission: 0,
          avulsoPayment: undefined,
          planServices: pro.totalSubscriptionServices,
          planCommission: pro.commissionAmount,
          planPayment: planPay,
          total: pro.commissionAmount,
        });
      }
    }

    return Array.from(map.values());
  })();

  const isLoading = loadingAvulso || loadingAvulsoPayments || loadingPlan || loadingPlanPayments;

  const filtered = proFilter
    ? merged.filter(r => r.name.toLowerCase().includes(proFilter.toLowerCase()))
    : merged;

  const isPaid = (r: MergedRow) =>
    (r.avulsoCommission === 0 || (r.avulsoPayment?.isPaid ?? false)) &&
    (r.planCommission   === 0 || (r.planPayment?.isPaid   ?? false));

  const allPaid    = filtered.length > 0 && filtered.every(isPaid);
  const totalToPay = filtered.reduce((s, r) => s + r.total, 0);

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

      {/* Resumo */}
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
            {allPaid ? 'Tudo pago' : `${filtered.filter(isPaid).length}/${filtered.length} pagos`}
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
          <p className="font-medium text-foreground">Nenhum atendimento em {MONTHS[month - 1]}/{year}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground">BARBEIRO</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">COMISSÃO AVULSA</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">COMISSÃO PLANO</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">TOTAL</th>
                <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground">STATUS</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filtered.map(row => {
                const paid = isPaid(row);

                return (
                  <tr key={row.professionalId} className="hover:bg-accent/10 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-4 h-4 text-primary" />
                        </div>
                        <p className="font-medium text-foreground">{row.name}</p>
                      </div>
                    </td>

                    {/* Avulso commission */}
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {row.avulsoCommission > 0 ? (
                        <div>
                          <p className="font-semibold text-foreground">{fmt(row.avulsoCommission)}</p>
                          <p className="text-xs text-muted-foreground">{row.avulsoServices} atend. · {row.avulsoRate}%</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Plan commission */}
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {row.planCommission > 0 ? (
                        <div>
                          <p className="font-semibold text-amber-400">{fmt(row.planCommission)}</p>
                          <p className="text-xs text-muted-foreground">{row.planServices} atend. plano</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>

                    {/* Total */}
                    <td className="px-4 py-3 text-right">
                      <p className="font-bold text-primary text-base">{fmt(row.total)}</p>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 text-center">
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

                    {/* Action */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setModal(row)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
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
          row={modal}
          year={year}
          month={month}
          onClose={() => setModal(null)}
          onSaveAvulso={async (notes) => {
            await markAvulso.mutateAsync({
              professionalId:   modal.professionalId,
              year,
              month,
              totalServices:    modal.avulsoServices,
              grossAmount:      modal.avulsoGross,
              commissionRate:   modal.avulsoRate,
              commissionAmount: modal.avulsoCommission,
              notes: notes || undefined,
            });
          }}
          onUnmarkAvulso={async () => {
            if (modal.avulsoPayment) await unmarkAvulso.mutateAsync(modal.avulsoPayment.id);
          }}
          onSavePlan={async (notes) => {
            if (!planReport) return;
            await markPlan.mutateAsync({
              professionalId:             modal.professionalId,
              year,
              month,
              model:                      planReport.model,
              totalSubscriptionServices:  modal.planServices,
              subscriptionRevenue:        planReport.totalRevenue,
              commissionAmount:           modal.planCommission,
              notes: notes || undefined,
            });
          }}
          onUnmarkPlan={async () => {
            if (modal.planPayment) await unmarkPlan.mutateAsync(modal.planPayment.id);
          }}
        />
      )}
    </div>
  );
}
