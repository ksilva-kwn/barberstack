'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Search, X, Loader2, Pencil, Trash2, Package,
  AlertTriangle, ArrowUp, ArrowDown,
} from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { productApi, Product, ProductType } from '@/lib/product.api';

const inputCls = 'w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors';

const EMPTY_FORM = {
  name: '',
  description: '',
  price: 0,
  costPrice: 0,
  stock: 0,
  minStockAlert: 5,
  unit: 'un',
  isActive: true,
};

function ProductModal({
  type,
  initial,
  onClose,
  onSave,
}: {
  type: ProductType;
  initial?: Partial<Product>;
  onClose: () => void;
  onSave: (data: typeof EMPTY_FORM & { type: ProductType }) => Promise<void>;
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: Number(initial?.price ?? 0),
    costPrice: Number(initial?.costPrice ?? 0),
    stock: initial?.stock ?? 0,
    minStockAlert: initial?.minStockAlert ?? 5,
    unit: initial?.unit ?? 'un',
    isActive: initial?.isActive ?? true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Nome é obrigatório'); return; }
    setError(''); setSubmitting(true);
    try { await onSave({ ...form, type }); }
    catch (err: any) { setError(err.response?.data?.error ?? 'Erro ao salvar'); }
    finally { setSubmitting(false); }
  };

  const unitOptions = ['un', 'ml', 'L', 'g', 'kg', 'cx', 'pc'];

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {initial?.id ? 'Editar Produto' : 'Novo Produto'}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nome *</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Gel Capilar, Whisky 50ml..." />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Descrição</label>
              <input className={inputCls} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Descrição opcional" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Preço de venda *</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', parseFloat(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Preço de custo</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.costPrice} onChange={e => set('costPrice', parseFloat(e.target.value) || 0)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Estoque atual</label>
                <input className={inputCls} type="number" min="0" value={form.stock} onChange={e => set('stock', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Alerta mínimo</label>
                <input className={inputCls} type="number" min="0" value={form.minStockAlert} onChange={e => set('minStockAlert', parseInt(e.target.value) || 0)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Unidade</label>
                <select className={inputCls} value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} className="rounded" />
              <label htmlFor="isActive" className="text-sm text-muted-foreground">Produto ativo</label>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function StockModal({ product, onClose, onSave }: {
  product: Product;
  onClose: () => void;
  onSave: (delta: number, note: string) => Promise<void>;
}) {
  const [delta, setDelta] = useState(1);
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try { await onSave(mode === 'in' ? delta : -delta, ''); }
    catch (err: any) { setError(err.response?.data?.error ?? 'Erro'); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-base font-semibold text-foreground">Ajustar estoque</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            <span className="font-medium text-foreground">{product.name}</span> — estoque atual: <span className="font-bold">{product.stock} {product.unit}</span>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setMode('in')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${mode === 'in' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                <ArrowUp className="w-4 h-4" /> Entrada
              </button>
              <button type="button" onClick={() => setMode('out')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm font-medium transition-colors ${mode === 'out' ? 'border-destructive bg-destructive/10 text-destructive' : 'border-border text-muted-foreground hover:bg-accent'}`}>
                <ArrowDown className="w-4 h-4" /> Saída
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Quantidade</label>
              <input className={inputCls} type="number" min="1" value={delta} onChange={e => setDelta(parseInt(e.target.value) || 1)} />
            </div>

            <p className="text-xs text-muted-foreground">
              Novo estoque: <span className="font-bold text-foreground">
                {Math.max(0, product.stock + (mode === 'in' ? delta : -delta))} {product.unit}
              </span>
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ProductPage({ type, title, description }: { type: ProductType; title: string; description: string }) {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const qc = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', type, search],
    queryFn: () => productApi.list(type, search || undefined).then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => productApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', type] }); setShowModal(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => productApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', type] }); setEditProduct(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', type] }),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) => productApi.adjustStock(id, delta),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['products', type] }); setStockProduct(null); },
  });

  const lowStockCount = products.filter(p => p.isActive && p.stock <= p.minStockAlert).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {lowStockCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span><span className="font-semibold">{lowStockCount} produto{lowStockCount !== 1 ? 's' : ''}</span> com estoque abaixo do mínimo</span>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          placeholder="Buscar produto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
          <p className="text-foreground font-medium mb-1">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
          <p className="text-sm text-muted-foreground">{search ? 'Tente outro termo.' : 'Cadastre o primeiro produto.'}</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">PRODUTO</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">ESTOQUE</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">CUSTO</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">PREÇO</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map(p => {
                const lowStock = p.isActive && p.stock <= p.minStockAlert;
                return (
                  <tr key={p.id} className="hover:bg-accent/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${p.isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                          <Package className={`w-4 h-4 ${p.isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className={`font-medium ${p.isActive ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{p.name}</p>
                          {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setStockProduct(p)}
                        className={`text-sm font-semibold px-2 py-0.5 rounded transition-colors hover:bg-accent ${lowStock ? 'text-amber-400' : 'text-foreground'}`}
                        title="Ajustar estoque"
                      >
                        {lowStock && <AlertTriangle className="w-3 h-3 inline mr-1 mb-0.5" />}
                        {p.stock} {p.unit}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      {p.costPrice != null ? `R$ ${Number(p.costPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-foreground">
                      R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEditProduct(p)} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Excluir "${p.name}"?`)) deleteMutation.mutate(p.id);
                          }}
                          className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
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
        </div>
      )}

      {(showModal || editProduct) && (
        <ProductModal
          type={type}
          initial={editProduct ?? undefined}
          onClose={() => { setShowModal(false); setEditProduct(null); }}
          onSave={async (data) => {
            if (editProduct) {
              await updateMutation.mutateAsync({ id: editProduct.id, data });
            } else {
              await createMutation.mutateAsync(data);
            }
          }}
        />
      )}

      {stockProduct && (
        <StockModal
          product={stockProduct}
          onClose={() => setStockProduct(null)}
          onSave={async (delta) => {
            await stockMutation.mutateAsync({ id: stockProduct.id, delta });
          }}
        />
      )}
    </div>
  );
}
