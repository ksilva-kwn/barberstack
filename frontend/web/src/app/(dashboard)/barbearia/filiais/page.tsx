'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Phone, Pencil, Trash2, Loader2, X, Check, Star, Mail, Building2 } from 'lucide-react';
import { barbershopApi, Branch } from '@/lib/barbershop.api';
import { useAuthStore } from '@/store/auth.store';
import * as Dialog from '@radix-ui/react-dialog';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors';

function fmtCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
}

function fmtPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
}

function fmtZip(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length > 5 ? `${d.slice(0,5)}-${d.slice(5)}` : d;
}

const EMPTY_FORM = {
  name: '', cnpj: '', email: '', managerName: '',
  address: '', phone: '', city: '', state: '', zipCode: '', isMain: false,
};

function BranchModal({ initial, onClose, onSave }: {
  initial?: Partial<Branch>;
  onClose: () => void;
  onSave: (data: typeof EMPTY_FORM) => Promise<void>;
}) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    name:        initial?.name        ?? '',
    cnpj:        initial?.cnpj        ?? '',
    email:       initial?.email       ?? '',
    managerName: initial?.managerName ?? '',
    address:     initial?.address     ?? '',
    phone:       initial?.phone       ?? '',
    city:        initial?.city        ?? '',
    state:       initial?.state       ?? '',
    zipCode:     initial?.zipCode     ?? '',
    isMain:      initial?.isMain      ?? false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof EMPTY_FORM, v: string | boolean) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleCep = async (raw: string) => {
    const zip = fmtZip(raw);
    set('zipCode', zip);
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    setCepLoading(true);
    try {
      const r = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const d = await r.json();
      if (!d.erro) {
        setForm(f => ({
          ...f, zipCode: zip,
          address: d.logradouro ?? f.address,
          city: d.localidade ?? f.city,
          state: d.uf ?? f.state,
        }));
      }
    } catch { /* ignore */ } finally { setCepLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) { setError('Nome é obrigatório'); return; }
    setError(''); setSubmitting(true);
    try { await onSave(form); }
    catch (err: any) { setError(err.response?.data?.error ?? 'Erro ao salvar'); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {initial?.id ? 'Editar Filial' : 'Nova Filial'}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Nome */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Nome da filial *</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Unidade Centro" />
            </div>

            {/* CNPJ + Email */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">CNPJ</label>
                <input
                  className={inputCls} value={form.cnpj}
                  onChange={e => set('cnpj', fmtCnpj(e.target.value))}
                  placeholder="00.000.000/0000-00"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">E-mail</label>
                <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="filial@barbearia.com" />
              </div>
            </div>

            {/* Responsável + Telefone */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Responsável</label>
                <input className={inputCls} value={form.managerName} onChange={e => set('managerName', e.target.value)} placeholder="Nome do gerente" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Telefone</label>
                <input className={inputCls} value={form.phone} onChange={e => set('phone', fmtPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </div>
            </div>

            {/* CEP + auto-fill */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">
                CEP {cepLoading && <span className="text-primary ml-1">buscando...</span>}
              </label>
              <input
                className={inputCls} value={form.zipCode}
                onChange={e => handleCep(e.target.value)}
                placeholder="00000-000"
              />
            </div>

            {/* Endereço */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Endereço</label>
              <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, número, complemento" />
            </div>

            {/* Cidade + Estado */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Cidade</label>
                <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="São Paulo" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase tracking-wide">Estado</label>
                <input className={inputCls} value={form.state} onChange={e => set('state', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
              </div>
            </div>

            {/* Principal */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-1">
              <div
                onClick={() => set('isMain', !form.isMain)}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${form.isMain ? 'bg-primary border-primary' : 'border-border'}`}
              >
                {form.isMain && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              <span className="text-sm text-foreground">Marcar como filial principal</span>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function FiliaisPage() {
  const { user } = useAuthStore();
  const barbershopId = user?.barbershopId ?? '';
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);

  const { data: branches = [], isLoading } = useQuery<Branch[]>({
    queryKey: ['branches', barbershopId],
    queryFn: () => barbershopApi.branches(barbershopId).then(r => r.data),
    enabled: !!barbershopId,
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof EMPTY_FORM) =>
      barbershopApi.createBranch(barbershopId, data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches', barbershopId] }); setShowCreate(false); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof EMPTY_FORM }) =>
      barbershopApi.updateBranch(barbershopId, id, data as any),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['branches', barbershopId] }); setEditing(null); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => barbershopApi.deleteBranch(barbershopId, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches', barbershopId] }),
  });

  const toggleActive = (b: Branch) =>
    barbershopApi.updateBranch(barbershopId, b.id, { isActive: !b.isActive })
      .then(() => qc.invalidateQueries({ queryKey: ['branches', barbershopId] }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Filiais</h1>
          <p className="text-muted-foreground text-sm">Gerencie as unidades da barbearia. Serviços e planos são compartilhados entre filiais.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Filial
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : branches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-card border border-border rounded-xl">
          <MapPin className="w-12 h-12 text-muted-foreground mb-4 opacity-30" />
          <p className="text-foreground font-medium mb-1">Nenhuma filial cadastrada</p>
          <p className="text-sm text-muted-foreground">Crie a primeira unidade da barbearia.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {branches.map(branch => (
            <div
              key={branch.id}
              className={`bg-card border rounded-xl p-4 flex items-start gap-4 transition-opacity ${!branch.isActive ? 'opacity-50 border-border/50' : 'border-border'}`}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">{branch.name}</p>
                  {branch.isMain && (
                    <span className="flex items-center gap-1 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full px-2 py-0.5 font-medium">
                      <Star className="w-2.5 h-2.5" /> Principal
                    </span>
                  )}
                  {!branch.isActive && (
                    <span className="text-[10px] bg-muted text-muted-foreground rounded-full px-2 py-0.5">Inativa</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                  {branch.cnpj && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" /> {branch.cnpj}
                    </span>
                  )}
                  {(branch.address || branch.city) && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3" />
                      {[branch.address, branch.city, branch.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {branch.phone && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" /> {branch.phone}
                    </span>
                  )}
                  {branch.email && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="w-3 h-3" /> {branch.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => toggleActive(branch)}
                  title={branch.isActive ? 'Desativar' : 'Ativar'}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${branch.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
                >
                  {branch.isActive ? 'Ativa' : 'Inativa'}
                </button>
                <button onClick={() => setEditing(branch)} className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                {!branch.isMain && (
                  <button onClick={() => deleteMutation.mutate(branch.id)} className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <BranchModal onClose={() => setShowCreate(false)} onSave={async data => { await createMutation.mutateAsync(data); }} />
      )}
      {editing && (
        <BranchModal initial={editing} onClose={() => setEditing(null)} onSave={async data => { await updateMutation.mutateAsync({ id: editing.id, data }); }} />
      )}
    </div>
  );
}
