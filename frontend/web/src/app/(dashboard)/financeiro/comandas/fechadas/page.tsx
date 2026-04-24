'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle, CreditCard, Banknote, Smartphone, Loader2, RotateCcw, Pencil, Trash2, Package, ShoppingCart, Plus, X, Crown } from 'lucide-react';
import { appointmentApi, Appointment, PaymentMethod } from '@/lib/appointment.api';
import { productApi, Product } from '@/lib/product.api';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';
import { Pagination, usePagination } from '@/components/ui/pagination';

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

const METHODS: PaymentMethod[] = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'];

const RANGE_OPTIONS = [
  { label: 'Hoje',           days: 0 },
  { label: 'Últimos 7 dias', days: 7 },
  { label: 'Últimos 30 dias', days: 30 },
];

function EditMethodDropdown({ current, onSave }: { current: PaymentMethod | null; onSave: (m: PaymentMethod) => void }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentMethod | null>(current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        title="Editar forma de pagamento"
        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
      >
        <Pencil className="w-3.5 h-3.5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => { setOpen(false); setSelected(current); }} />
          <div className="absolute right-0 bottom-8 z-20 bg-card border border-border rounded-lg shadow-xl py-2 min-w-[200px]">
            <p className="px-3 pb-1.5 text-[10px] text-muted-foreground font-medium uppercase tracking-wide border-b border-border mb-1">
              Alterar forma de pagamento
            </p>
            {METHODS.map((m) => (
              <button
                key={m}
                onClick={() => setSelected(m)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors text-left',
                  selected === m ? 'bg-primary/15 text-primary font-medium' : 'text-foreground hover:bg-accent',
                )}
              >
                {PAYMENT_METHOD_ICON[m]}
                {PAYMENT_METHOD_LABEL[m]}
                {selected === m && <CheckCircle className="w-3 h-3 ml-auto" />}
              </button>
            ))}
            <div className="border-t border-border mt-1 px-2 pt-2">
              <button
                onClick={() => { if (selected) { setOpen(false); onSave(selected); } }}
                disabled={!selected}
                className="w-full py-1.5 rounded-md text-xs font-medium bg-primary/15 text-primary border border-primary/30 hover:bg-primary/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Salvar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AddProductModal({ appointmentId, onClose }: { appointmentId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [qty, setQty] = useState<Record<string, number>>({});

  const { data: products = [] } = useQuery({
    queryKey: ['products-picker', search],
    queryFn: () => productApi.list(undefined, search || undefined).then(r => r.data.filter(p => p.isActive)),
  });

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      appointmentApi.addProduct(appointmentId, productId, quantity),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['comandas-fechadas'] }),
  });

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-5 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-foreground">Editar produtos da comanda</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>
          <input
            className="w-full pl-3 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 mb-3"
            placeholder="Buscar produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="flex-1 overflow-y-auto space-y-2">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto encontrado.</p>
            ) : products.map(p => (
              <div key={p.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background border border-border">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">
                    R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} · Estoque: {p.stock} {p.unit}
                  </p>
                </div>
                <input
                  type="number"
                  min="1"
                  value={qty[p.id] ?? 1}
                  onChange={e => setQty(prev => ({ ...prev, [p.id]: parseInt(e.target.value) || 1 }))}
                  className="w-14 px-2 py-1 text-xs rounded-md bg-muted border border-border text-foreground text-center"
                />
                <button
                  onClick={() => addMutation.mutate({ productId: p.id, quantity: qty[p.id] ?? 1 })}
                  disabled={addMutation.isPending}
                  className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={onClose} className="mt-4 w-full py-2 rounded-lg border border-border text-muted-foreground text-sm hover:bg-accent transition-colors">
            Fechar
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function ComandasFechadasPage() {
  const queryClient = useQueryClient();
  const [rangeIdx, setRangeIdx] = useState(1);
  const [productModal, setProductModal] = useState<string | null>(null);
  const { page, pageSize, setPage, setPageSize, paginate, resetPage } = usePagination(25);
  const range = RANGE_OPTIONS[rangeIdx];

  // Busca TODOS os COMPLETED pagos (sem filtro de data no servidor — filtramos por paidAt no cliente)
  const { data: all = [], isLoading } = useQuery<Appointment[]>({
    queryKey: ['comandas-fechadas'],
    queryFn: () =>
      appointmentApi.list({ status: 'COMPLETED' }).then(r =>
        r.data.filter(a => a.paymentStatus === 'PAID')
      ),
  });

  // Filtra por paidAt no cliente
  const rangeStart = range.days === 0
    ? startOfDay(new Date())
    : subDays(new Date(), range.days);

  const appointments = all.filter(a => {
    if (!a.paidAt) return true; // sem paidAt aparece sempre
    return new Date(a.paidAt) >= rangeStart;
  });

  const editMutation = useMutation({
    mutationFn: ({ id, method }: { id: string; method: PaymentMethod }) =>
      appointmentApi.updatePayment(id, 'PAID', method),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas-fechadas'] }),
  });

  const reopenMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.updatePayment(id, 'PENDING'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comandas-fechadas'] });
      queryClient.invalidateQueries({ queryKey: ['comandas-abertas'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas-fechadas'] }),
  });

  const removeProductMutation = useMutation({
    mutationFn: ({ aptId, itemId }: { aptId: string; itemId: string }) =>
      appointmentApi.removeProduct(aptId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas-fechadas'] }),
  });

  const totalPaid = appointments.reduce((sum, a) => {
    const productsTotal = (a.appointmentProducts ?? []).reduce((s, p) => s + Number(p.price) * p.quantity, 0);
    return sum + Number(a.totalAmount) + productsTotal;
  }, 0);

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
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          {RANGE_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              onClick={() => { setRangeIdx(i); resetPage(); }}
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

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Atendimentos</p>
          <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 col-span-2 md:col-span-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total recebido</p>
          <p className="text-2xl font-bold text-emerald-400">
            R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        {Object.entries(byMethod).slice(0, 2).map(([method, data]) => (
          <div key={method} className="bg-card border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {PAYMENT_METHOD_LABEL[method as PaymentMethod] ?? method}
            </p>
            <p className="text-lg font-bold text-foreground">{data.count}</p>
            <p className="text-xs text-muted-foreground">R$ {data.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        ))}
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
            <p className="text-sm">Nenhuma comanda fechada no período</p>
          </div>
        ) : (
          <>
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
              {paginate<Appointment>(appointments).map((apt, i) => {
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
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        {clientLabel}
                        {apt.clientSubscription && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{barber}</td>
                    <td className="px-4 py-3">
                      <div className="text-muted-foreground text-xs max-w-[200px] truncate">{services}</div>
                      {(apt.appointmentProducts ?? []).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(apt.appointmentProducts ?? []).map(p => (
                            <span key={p.id} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px]">
                              <Package className="w-2.5 h-2.5" />{p.quantity}× {p.product.name}
                              <button
                                onClick={() => removeProductMutation.mutate({ aptId: apt.id, itemId: p.id })}
                                className="ml-0.5 hover:text-destructive transition-colors"
                                title="Remover produto"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
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
                      {(() => {
                        const productsTotal = (apt.appointmentProducts ?? []).reduce((s, p) => s + Number(p.price) * p.quantity, 0);
                        const grand = Number(apt.totalAmount) + productsTotal;
                        return (
                          <>
                            <div>R$ {grand.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                            {productsTotal > 0 && (
                              <div className="text-[10px] text-muted-foreground">serv+prod</div>
                            )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setProductModal(apt.id)}
                          title="Editar produtos"
                          className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                        <EditMethodDropdown
                          current={method}
                          onSave={(m) => editMutation.mutate({ id: apt.id, method: m })}
                        />
                        <button
                          onClick={() => reopenMutation.mutate(apt.id)}
                          title="Reabrir comanda"
                          className="p-1.5 rounded text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Excluir esta comanda? Esta ação não pode ser desfeita.')) {
                              deleteMutation.mutate(apt.id);
                            }
                          }}
                          title="Excluir comanda"
                          className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            total={appointments.length}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
          </>
        )}
      </div>

      {productModal && (
        <AddProductModal
          appointmentId={productModal}
          onClose={() => setProductModal(null)}
        />
      )}
    </div>
  );
}
