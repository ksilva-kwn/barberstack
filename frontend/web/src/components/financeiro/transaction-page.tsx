'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Pencil, Trash2, CheckCircle, Loader2, X, Clock, AlertTriangle } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  financialApi, FinancialTransaction, TxType, TxStatus,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES,
} from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const PAYMENT_LABELS: Record<string, string> = {
  PIX: 'Pix', CREDIT_CARD: 'Cartão Crédito', DEBIT_CARD: 'Cartão Débito', CASH: 'Dinheiro', BOLETO: 'Boleto',
};

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function TxModal({
  type, initial, onClose,
}: {
  type: TxType; initial?: FinancialTransaction | null; onClose: () => void;
}) {
  const qc = useQueryClient();
  const categories = type === 'EXPENSE' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  const [form, setForm] = useState({
    title:         initial?.title ?? '',
    category:      initial?.category ?? categories[0],
    amount:        initial?.amount ? String(initial.amount) : '',
    description:   initial?.description ?? '',
    paymentMethod: initial?.paymentMethod ?? '',
    status:        initial?.status ?? 'PAID' as TxStatus,
    dueDate:       initial?.dueDate ? initial.dueDate.slice(0, 10) : '',
    paidAt:        initial?.paidAt  ? initial.paidAt.slice(0, 10)  : '',
  });
  const [error, setError] = useState('');

  const qk = ['transactions', type];

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        type, ...form,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod || undefined,
        dueDate: form.dueDate || undefined,
        paidAt:  form.paidAt  || undefined,
      };
      return initial
        ? financialApi.updateTransaction(initial.id, payload)
        : financialApi.createTransaction(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); qc.invalidateQueries({ queryKey: ['balance'] }); onClose(); },
    onError:   (e: any) => setError(e.response?.data?.error ?? 'Erro ao salvar'),
  });

  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const inputCls = 'w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-5 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-foreground">
              {initial ? 'Editar' : 'Nova'} {type === 'EXPENSE' ? 'Despesa' : 'Receita'}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Título *</label>
              <input className={inputCls} value={form.title} onChange={e => f('title', e.target.value)} placeholder="Ex: Aluguel de março" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Categoria *</label>
                <select className={inputCls} value={form.category} onChange={e => f('category', e.target.value)}>
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Valor (R$) *</label>
                <input className={inputCls} type="number" min="0.01" step="0.01" value={form.amount} onChange={e => f('amount', e.target.value)} placeholder="0,00" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Status</label>
                <select className={inputCls} value={form.status} onChange={e => f('status', e.target.value)}>
                  <option value="PAID">Pago</option>
                  <option value="PENDING">Pendente</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Forma de pagamento</label>
                <select className={inputCls} value={form.paymentMethod} onChange={e => f('paymentMethod', e.target.value)}>
                  <option value="">Não informado</option>
                  <option value="PIX">Pix</option>
                  <option value="CASH">Dinheiro</option>
                  <option value="CREDIT_CARD">Cartão Crédito</option>
                  <option value="DEBIT_CARD">Cartão Débito</option>
                  <option value="BOLETO">Boleto</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {form.status === 'PAID' && (
                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Data do pagamento</label>
                  <input className={inputCls} type="date" value={form.paidAt} onChange={e => f('paidAt', e.target.value)} />
                </div>
              )}
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Vencimento</label>
                <input className={inputCls} type="date" value={form.dueDate} onChange={e => f('dueDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Observação (opcional)</label>
              <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={e => f('description', e.target.value)} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-accent transition-colors">Cancelar</button>
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.title || !form.amount}
                className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface TransactionPageProps {
  type: TxType;
  status?: TxStatus; // se definido, filtra por status (para Contas a Pagar/Receber)
  title: string;
  description: string;
}

export function TransactionPage({ type, status, title, description }: TransactionPageProps) {
  const qc = useQueryClient();
  const [modal, setModal] = useState<'new' | FinancialTransaction | null>(null);
  const qk = ['transactions', type, status];

  const { data: txs = [], isLoading } = useQuery({
    queryKey: qk,
    queryFn: () => financialApi.transactions({ type, ...(status ? { status } : {}) }).then(r => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => financialApi.deleteTransaction(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); qc.invalidateQueries({ queryKey: ['balance'] }); },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => financialApi.updateTransaction(id, { status: 'PAID' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: qk }); qc.invalidateQueries({ queryKey: ['balance'] }); },
  });

  const totalPaid    = txs.filter(t => t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
  const totalPending = txs.filter(t => t.status === 'PENDING').reduce((s, t) => s + Number(t.amount), 0);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <button
          onClick={() => setModal('new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          {type === 'EXPENSE' ? 'Nova despesa' : 'Nova receita'}
        </button>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {!status && (
          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{type === 'EXPENSE' ? 'Total pago' : 'Total recebido'}</p>
            <p className={cn('text-2xl font-bold', type === 'EXPENSE' ? 'text-destructive' : 'text-emerald-400')}>{fmt(totalPaid)}</p>
          </div>
        )}
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Pendente</p>
          <p className="text-2xl font-bold text-amber-400">{fmt(totalPending)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Lançamentos</p>
          <p className="text-2xl font-bold text-foreground">{txs.length}</p>
        </div>
      </div>

      {/* Lista */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : txs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <p className="text-sm">Nenhum lançamento encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Título</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Categoria</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Vencimento</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {txs.map((tx, i) => {
                const overdue = tx.status === 'PENDING' && tx.dueDate && tx.dueDate.slice(0, 10) < today;
                return (
                  <tr key={tx.id} className={cn('border-b border-border/50 last:border-0', i % 2 !== 0 && 'bg-muted/10')}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{tx.title}</p>
                      {tx.description && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{tx.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{tx.category}</td>
                    <td className="px-4 py-3 text-xs">
                      {tx.dueDate ? (
                        <span className={cn(overdue ? 'text-destructive font-medium' : 'text-muted-foreground')}>
                          {overdue && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                          {format(new Date(tx.dueDate), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {tx.status === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                          <CheckCircle className="w-3 h-3" /> Pago
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-400">
                          <Clock className="w-3 h-3" /> Pendente
                        </span>
                      )}
                    </td>
                    <td className={cn('px-4 py-3 text-right font-semibold', type === 'EXPENSE' ? 'text-destructive' : 'text-emerald-400')}>
                      {fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {tx.status === 'PENDING' && (
                          <button onClick={() => payMutation.mutate(tx.id)} title="Marcar como pago"
                            className="p-1.5 rounded text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setModal(tx)} title="Editar"
                          className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm('Excluir este lançamento?')) deleteMutation.mutate(tx.id); }}
                          title="Excluir"
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {modal !== null && (
        <TxModal
          type={type}
          initial={modal === 'new' ? null : (modal as FinancialTransaction)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
