'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Users, Search, X, Loader2, Phone, Mail, ShieldOff } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { barbershopApi, Client } from '@/lib/barbershop.api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

// ─── Add Client Modal ─────────────────────────────────────────────────────────
function AddClientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) { setError('Nome e e-mail são obrigatórios'); return; }
    setError(''); setSubmitting(true);
    try {
      await barbershopApi.createClient({ name: form.name, email: form.email, phone: form.phone || undefined });
      onCreated();
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao cadastrar cliente');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">Novo Cliente</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome completo</label>
              <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="João Silva" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
              <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="cliente@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Telefone <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <p className="text-xs text-muted-foreground">A senha inicial será <span className="font-mono bg-muted px-1 rounded">barberstack123</span> — o cliente pode alterar depois.</p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => barbershopApi.clients(search || undefined).then(r => r.data),
  });

  // Reset to page 1 whenever search changes
  const handleSearch = (v: string) => { setSearch(v); setPage(1); };

  const totalPages = Math.max(1, Math.ceil(clients.length / PAGE_SIZE));
  const paginated = clients.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const blockMutation = useMutation({
    mutationFn: (id: string) => barbershopApi.blockClient(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['clients-blocked'] });
    },
  });

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground text-sm">{clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrado{clients.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
        />
        {search && (
          <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-1">
            {search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
          </p>
          <p className="text-sm text-muted-foreground">
            {search ? 'Tente buscar por outro termo.' : 'Cadastre o primeiro cliente para começar.'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="divide-y divide-border">
              {paginated.map((client: Client) => (
                <div key={client.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {initials(client.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{client.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {client.email && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />{client.email}
                        </span>
                      )}
                      {client.phone && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Phone className="w-3 h-3" />{client.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      desde {format(new Date(client.createdAt), "MMM 'de' yyyy", { locale: ptBR })}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(`Bloquear ${client.name}? Ele não poderá fazer novos agendamentos.`)) {
                          blockMutation.mutate(client.id);
                        }
                      }}
                      disabled={blockMutation.isPending}
                      title="Bloquear cliente"
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    >
                      <ShieldOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Mostrando {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, clients.length)} de {clients.length}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-muted-foreground text-sm">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-primary text-primary-foreground'
                            : 'border border-border text-foreground hover:bg-accent'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Próximo
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showAddModal && (
        <AddClientModal
          onClose={() => setShowAddModal(false)}
          onCreated={() => { setShowAddModal(false); qc.invalidateQueries({ queryKey: ['clients'] }); }}
        />
      )}
    </div>
  );
}
