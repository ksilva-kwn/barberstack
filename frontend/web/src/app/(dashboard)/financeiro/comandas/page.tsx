'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CheckCircle, Clock, CreditCard, Banknote, Smartphone, Loader2,
  ChevronDown, Trash2, ShoppingCart, Plus, X, Package, Crown,
} from 'lucide-react';
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

const METHODS: PaymentMethod[] = ['PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'CASH'];

function PaymentDropdown({ onPay, isPending }: { onPay: (method: PaymentMethod) => void; isPending?: boolean }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PaymentMethod | null>(null);

  return (
    <div className="relative">
      <button
        onClick={() => !isPending && setOpen(v => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
        Receber
        {!isPending && <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />}
      </button>

      {open && !isPending && (
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
                onClick={() => { if (selected) { setOpen(false); onPay(selected); setSelected(null); } }}
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comandas-abertas'] });
    },
  });

  const handleAdd = async (p: Product) => {
    const quantity = qty[p.id] ?? 1;
    await addMutation.mutateAsync({ productId: p.id, quantity });
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-5 max-h-[80vh] flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-foreground">Adicionar produto à comanda</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>

          <div className="relative mb-3">
            <input
              className="w-full pl-3 pr-4 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Buscar produto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {products.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum produto cadastrado.</p>
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
                  onClick={() => handleAdd(p)}
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

export default function ComandasAbertasPage() {
  const queryClient = useQueryClient();
  const [productModal, setProductModal] = useState<string | null>(null);
  const { page, pageSize, setPage, setPageSize, paginate } = usePagination(25);

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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas-abertas'] }),
  });

  const removeProductMutation = useMutation({
    mutationFn: ({ aptId, itemId }: { aptId: string; itemId: string }) =>
      appointmentApi.removeProduct(aptId, itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['comandas-abertas'] }),
  });

  const totalPending = appointments.reduce((sum, a) => {
    const productsTotal = (a.appointmentProducts ?? []).reduce((s, p) => s + Number(p.price) * p.quantity, 0);
    return sum + Number(a.totalAmount) + productsTotal;
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comandas abertas</h1>
        <p className="text-muted-foreground text-sm">Atendimentos finalizados aguardando pagamento</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-sm">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pendentes</p>
          <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Total</p>
          <p className="text-2xl font-bold text-amber-400">
            R$ {totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>

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
          <>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Barbeiro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Itens</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Data / Hora</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {paginate<Appointment>(appointments).map((apt, i) => {
                const clientLabel = apt.client?.name ?? apt.clientName ?? 'Cliente';
                const barber = apt.professional?.nickname ?? apt.professional?.user?.name ?? '—';
                const dt = new Date(apt.scheduledAt);
                const products = apt.appointmentProducts ?? [];
                const productsTotal = products.reduce((s, p) => s + Number(p.price) * p.quantity, 0);
                const grandTotal = Number(apt.totalAmount) + productsTotal;

                return (
                  <tr key={apt.id} className={cn('border-b border-border/50 last:border-0', i % 2 !== 0 && 'bg-muted/10')}>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <span className="flex items-center gap-1.5">
                        {clientLabel}
                        {apt.clientSubscription && <Crown className="w-3 h-3 text-amber-400 shrink-0" />}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{barber}</td>
                    <td className="px-4 py-3">
                      {/* Serviços */}
                      <div className="text-muted-foreground text-xs">
                        {apt.services.map(s => s.service.name).join(', ')}
                      </div>
                      {/* Produtos */}
                      {products.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {products.map(p => (
                            <span key={p.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">
                              <Package className="w-2.5 h-2.5" />
                              {p.quantity}× {p.product.name}
                              <button
                                onClick={() => removeProductMutation.mutate({ aptId: apt.id, itemId: p.id })}
                                className="ml-0.5 hover:text-destructive transition-colors"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        {format(dt, "dd/MM/yy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground whitespace-nowrap">
                      <div>R$ {grandTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      {productsTotal > 0 && (
                        <div className="text-[10px] text-muted-foreground">
                          serv. R$ {Number(apt.totalAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + prod. R$ {productsTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {/* Adicionar produto */}
                        <button
                          onClick={() => setProductModal(apt.id)}
                          title="Adicionar produto"
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                        {/* Fechar comanda */}
                        <PaymentDropdown
                          onPay={(method) => payMutation.mutate({ id: apt.id, method })}
                          isPending={payMutation.isPending}
                        />
                        {/* Excluir */}
                        <button
                          onClick={() => {
                            if (confirm('Excluir esta comanda? Esta ação não pode ser desfeita.')) {
                              deleteMutation.mutate(apt.id);
                            }
                          }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Excluir comanda"
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
