'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCog, Scissors, X, Check, ChevronDown, ChevronUp, Loader2, Eye, EyeOff } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { barbershopApi, Professional, BarbershopService } from '@/lib/barbershop.api';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

// ─── Add Barber Modal ─────────────────────────────────────────────────────────
function AddBarberModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', nickname: '', commissionRate: '40' });
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) { setError('Nome, e-mail e senha são obrigatórios'); return; }
    setError(''); setSubmitting(true);
    try {
      await barbershopApi.createBarber({
        name: form.name, email: form.email,
        phone: form.phone || undefined,
        password: form.password,
        nickname: form.nickname || undefined,
        commissionRate: parseFloat(form.commissionRate) || 40,
      });
      onCreated();
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao criar barbeiro');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">Novo Barbeiro</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">Nome completo</label>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="João Silva" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
                <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="barbeiro@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Telefone</label>
                <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(11) 99999-9999" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Apelido</label>
                <input className={inputCls} value={form.nickname} onChange={e => set('nickname', e.target.value)} placeholder="Ex: João Tesoura" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Comissão (%)</label>
                <input className={inputCls} type="number" min="0" max="100" value={form.commissionRate} onChange={e => set('commissionRate', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Senha inicial</label>
                <div className="relative">
                  <input className={`${inputCls} pr-9`} type={showPwd ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Criando...' : 'Criar Barbeiro'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Professional Card ────────────────────────────────────────────────────────
function ProfessionalCard({ professional, allServices, onRefresh }: {
  professional: Professional;
  allServices: BarbershopService[];
  onRefresh: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const qc = useQueryClient();

  const assignedIds = new Set(professional.professionalServices?.map(ps => ps.service.id) ?? []);

  const assignMutation = useMutation({
    mutationFn: (serviceId: string) => barbershopApi.assignService(professional.id, serviceId),
    onSuccess: onRefresh,
  });

  const removeMutation = useMutation({
    mutationFn: (serviceId: string) => barbershopApi.removeService(professional.id, serviceId),
    onSuccess: onRefresh,
  });

  const initials = professional.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const assignedCount = assignedIds.size;

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">
            {professional.nickname ?? professional.user.name}
          </p>
          <p className="text-xs text-muted-foreground">{professional.user.email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-muted-foreground">{Number(professional.commissionRate)}% comissão</span>
          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {assignedCount} {assignedCount === 1 ? 'serviço' : 'serviços'}
          </span>
          <button
            onClick={() => setExpanded(v => !v)}
            className="p-1 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Services assignment */}
      {expanded && (
        <div className="border-t border-border p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Serviços que este barbeiro executa
          </p>
          {allServices.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado na barbearia.</p>
          ) : (
            <div className="space-y-2">
              {allServices.map(service => {
                const isAssigned = assignedIds.has(service.id);
                const isPending = assignMutation.isPending || removeMutation.isPending;
                return (
                  <div key={service.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-background">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.durationMins}min · R$ {Number(service.price).toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => isAssigned
                        ? removeMutation.mutate(service.id)
                        : assignMutation.mutate(service.id)
                      }
                      disabled={isPending}
                      className={`ml-3 flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isAssigned
                          ? 'bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive'
                          : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                      }`}
                    >
                      {isAssigned ? <><Check className="w-3 h-3" />Atribuído</> : <><Plus className="w-3 h-3" />Atribuir</>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function BarbeirosPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const qc = useQueryClient();

  const { data: professionals = [], isLoading: loadingProfs } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => barbershopApi.professionals().then(r => r.data),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => barbershopApi.services().then(r => r.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['professionals'] });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Barbeiros</h1>
          <p className="text-muted-foreground text-sm">Gerencie sua equipe e os serviços de cada profissional</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Barbeiro
        </button>
      </div>

      {loadingProfs ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : professionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <UserCog className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-1">Nenhum barbeiro cadastrado</p>
          <p className="text-sm text-muted-foreground">Adicione o primeiro profissional da sua equipe.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {professionals.map(p => (
            <ProfessionalCard key={p.id} professional={p} allServices={services} onRefresh={refresh} />
          ))}
        </div>
      )}

      {showAddModal && (
        <AddBarberModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); refresh(); }}
        />
      )}
    </div>
  );
}
