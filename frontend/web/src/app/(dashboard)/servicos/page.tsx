'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Scissors, X, Loader2, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { barbershopApi } from '@/lib/barbershop.api';
import { useAuthStore } from '@/store/auth.store';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

function AddServiceModal({ onClose, onCreated, isBarber, commissionRate }: { onClose: () => void; onCreated: () => void; isBarber: boolean; commissionRate: number }) {
  const [form, setForm] = useState({ name: '', price: '', durationMins: '30', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const commissionEarned = isBarber && form.price ? (parseFloat(form.price) * (commissionRate / 100)) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.durationMins) { setError('Nome, preço e duração são obrigatórios'); return; }
    setError(''); setSubmitting(true);
    try {
      await barbershopApi.createService({
        name: form.name,
        price: parseFloat(form.price),
        durationMins: parseInt(form.durationMins, 10),
        description: form.description || null,
      });
      onCreated();
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao criar serviço');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">Novo Serviço</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome do serviço</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Corte Masculino" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Valor (R$)</label>
                <input className={inputCls} type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} placeholder="50.00" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Tempo (min)</label>
                <input className={inputCls} type="number" min="5" step="5" value={form.durationMins} onChange={e => set('durationMins', e.target.value)} />
              </div>
            </div>
            
            {isBarber && (
              <div className="bg-primary/10 p-3 rounded-lg border border-primary/20 flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Sua comissão ({commissionRate}%)</span>
                <span className="font-semibold text-primary">R$ {commissionEarned.toFixed(2)}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descrição opcional</label>
              <textarea className={`${inputCls} resize-none`} rows={2} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Detalhes do corte..." />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Salvando...' : 'Salvar Serviço'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function ServicosPage() {
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const qc = useQueryClient();

  const isBarber = user?.role === 'BARBER';

  const { data: services = [], isLoading: loadingServices } = useQuery({
    queryKey: ['services'],
    queryFn: () => barbershopApi.services().then(r => r.data),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => barbershopApi.professionals().then(r => r.data),
    enabled: isBarber,
  });

  const myBarberProfile = professionals.find(p => p.user.email === user?.email);
  const commissionRate = myBarberProfile ? Number(myBarberProfile.commissionRate) : 0;

  const deleteMutation = useMutation({
    mutationFn: (id: string) => barbershopApi.deleteService(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
          <p className="text-muted-foreground text-sm">
            {isBarber ? 'Adicione seus serviços e veja a margem de comissão' : 'Gerencie o catálogo de serviços da barbearia'}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Serviço
        </button>
      </div>

      {loadingServices ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl">
          <Scissors className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-1">Nenhum serviço cadastrado</p>
          <p className="text-sm text-muted-foreground">Clique no botão acima para adicionar um novo serviço.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map(s => {
            const commissionAmount = isBarber ? (Number(s.price) * (commissionRate / 100)) : 0;
            return (
              <div key={s.id} className="bg-card border border-border rounded-xl p-5 hover:border-border/80 transition-colors relative group">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-foreground">{s.name}</h3>
                  <button
                    onClick={() => deleteMutation.mutate(s.id)}
                    className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Excluir serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {s.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{s.description}</p>
                )}
                <div className="flex flex-col gap-1 mt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Valor total:</span>
                    <span className="font-semibold text-foreground">R$ {Number(s.price).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Duração:</span>
                    <span className="text-sm font-medium text-foreground">{s.durationMins} min</span>
                  </div>
                  {isBarber && (
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-border">
                      <span className="text-sm text-primary">Sua comissão:</span>
                      <span className="text-sm font-bold text-primary">R$ {commissionAmount.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showAddModal && (
        <AddServiceModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); qc.invalidateQueries({ queryKey: ['services'] }); }}
          isBarber={isBarber}
          commissionRate={commissionRate}
        />
      )}
    </div>
  );
}
