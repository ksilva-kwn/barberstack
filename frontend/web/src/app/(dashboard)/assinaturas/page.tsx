'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Repeat2, Users, CreditCard, AlertTriangle, Loader2, X,
         ToggleLeft, ToggleRight, ExternalLink, Pencil, Ban, Check, Zap, MapPin } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { subscriptionApi, ClientPlan, ClientSubscription, SubStatus } from '@/lib/subscription.api';
import { barbershopApi } from '@/lib/barbershop.api';
import { paymentApi } from '@/lib/payment.api';
import { useAuth } from '@/hooks/use-auth';

// ─── helpers ──────────────────────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

const statusLabel: Record<SubStatus, { label: string; cls: string }> = {
  PENDING_PAYMENT: { label: 'Ag. Pagamento', cls: 'bg-blue-500/15 text-blue-500' },
  ACTIVE:          { label: 'Ativo',          cls: 'bg-emerald-500/15 text-emerald-500' },
  DEFAULTING:      { label: 'Inadimplente',   cls: 'bg-yellow-500/15 text-yellow-500' },
  CANCELING:       { label: 'Cancelando',     cls: 'bg-amber-500/15 text-amber-500' },
  CANCELED:        { label: 'Cancelado',      cls: 'bg-destructive/15 text-destructive' },
  SUSPENDED:       { label: 'Suspenso',       cls: 'bg-muted text-muted-foreground' },
};

// ─── Modal: Criar/Editar Plano ────────────────────────────────────────────────
function PlanModal({
  plan,
  onClose,
}: {
  plan?: ClientPlan;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEdit = !!plan;

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => barbershopApi.services().then(r => r.data),
  });

  const [name, setName]               = useState(plan?.name ?? '');
  const [price, setPrice]             = useState(plan?.price?.toString() ?? '');
  const [description, setDescription] = useState(plan?.description ?? '');
  const [billingCycle, setBillingCycle] = useState(plan?.billingCycle ?? 'monthly');
  const [isFeatured, setIsFeatured]           = useState(plan?.isFeatured ?? false);
  const [allowMultiBranch, setAllowMultiBranch] = useState(plan?.allowMultiBranch ?? false);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    plan?.services.map(s => s.serviceId) ?? [],
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (id: string) =>
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim())                    { setError('Nome obrigatório'); return; }
    if (!price || isNaN(Number(price)))  { setError('Preço inválido'); return; }
    if (selectedServiceIds.length === 0) { setError('Selecione ao menos um serviço'); return; }
    setError(''); setSubmitting(true);

    try {
      if (isEdit) {
        await subscriptionApi.updatePlan(plan.id, {
          name, price: Number(price), description: description || null,
          isFeatured, allowMultiBranch, serviceIds: selectedServiceIds,
        });
      } else {
        await subscriptionApi.createPlan({
          name, price: Number(price), description: description || undefined,
          billingCycle, isFeatured, allowMultiBranch, serviceIds: selectedServiceIds,
        });
      }
      qc.invalidateQueries({ queryKey: ['plans'] });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao salvar plano');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-card border border-border rounded-xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {isEdit ? 'Editar Plano' : 'Novo Plano'}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nome do plano</label>
              <input className={inputCls} value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Corte Ilimitado" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Valor mensal (R$)</label>
                <input className={inputCls} type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="99,90" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Ciclo</label>
                <select className={inputCls} value={billingCycle} onChange={e => setBillingCycle(e.target.value as 'monthly' | 'weekly')} disabled={isEdit}>
                  <option value="monthly">Mensal</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Descrição <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <textarea className={inputCls} rows={2} value={description} onChange={e => setDescription(e.target.value)} placeholder="Ex: 4 cortes por mês + barba inclusa" />
            </div>

            {/* Toggle destaque */}
            <button
              type="button"
              onClick={() => setIsFeatured(v => !v)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors ${
                isFeatured
                  ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-500'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <Zap className={`w-4 h-4 ${isFeatured ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${isFeatured ? 'text-yellow-500' : 'text-foreground'}`}>
                    Plano destaque
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Aparece destacado no portal do cliente
                  </p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative overflow-hidden ${isFeatured ? 'bg-yellow-500' : 'bg-muted'}`}>
                <span className={`absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform ${isFeatured ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </button>

            {/* Multi-filial toggle */}
            <button
              type="button"
              onClick={() => setAllowMultiBranch(v => !v)}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors ${
                allowMultiBranch
                  ? 'border-sky-500/50 bg-sky-500/10 text-sky-500'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40'
              }`}
            >
              <div className="flex items-center gap-3">
                <MapPin className={`w-4 h-4 ${allowMultiBranch ? 'text-sky-500' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${allowMultiBranch ? 'text-sky-500' : 'text-foreground'}`}>
                    Válido em todas as filiais
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Cliente pode usar o plano em qualquer unidade
                  </p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative overflow-hidden ${allowMultiBranch ? 'bg-sky-500' : 'bg-muted'}`}>
                <span className={`absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow transition-transform ${allowMultiBranch ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </button>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Serviços incluídos</label>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {(services as any[]).map((s: any) => {
                  const active = selectedServiceIds.includes(s.id);
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => toggleService(s.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-colors ${
                        active
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-background border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${active ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                        {active && <Check className="w-2.5 h-2.5 text-primary-foreground" />}
                      </div>
                      <span className="truncate">{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Salvando...' : isEdit ? 'Salvar' : 'Criar plano'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Modal: Assinar cliente ───────────────────────────────────────────────────
function SubscribeModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [clientId, setClientId]   = useState('');
  const [planId, setPlanId]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState('');
  const [result, setResult]       = useState<ClientSubscription | null>(null);

  const { data: clients = [] } = useQuery({
    queryKey: ['clients'],
    queryFn: () => barbershopApi.clients().then(r => r.data),
  });
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.plans(false).then(r => r.data),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) { setError('Selecione um cliente'); return; }
    if (!planId)   { setError('Selecione um plano');   return; }
    setError(''); setSubmitting(true);
    try {
      const { data } = await subscriptionApi.subscribe({ clientId, clientPlanId: planId });
      qc.invalidateQueries({ queryKey: ['subscriptions'] });
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao criar assinatura');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">Assinar Cliente</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/25">
                <Check className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-foreground">Assinatura criada com sucesso!</p>
              </div>
              {result.paymentLink && (
                <div className="p-4 rounded-lg bg-card border border-border space-y-2">
                  <p className="text-sm font-medium text-foreground">Link de pagamento (cartão)</p>
                  <p className="text-xs text-muted-foreground">Compartilhe este link com o cliente para que ele cadastre o cartão de crédito.</p>
                  <a
                    href={result.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline mt-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir link de pagamento
                  </a>
                </div>
              )}
              {!result.paymentLink && (
                <p className="text-sm text-muted-foreground">A barbearia não tem integração Asaas configurada. A assinatura foi criada localmente.</p>
              )}
              <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Fechar</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Cliente</label>
                <select className={inputCls} value={clientId} onChange={e => setClientId(e.target.value)}>
                  <option value="">Selecione o cliente</option>
                  {(clients as any[]).map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.email}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Plano</label>
                <select className={inputCls} value={planId} onChange={e => setPlanId(e.target.value)}>
                  <option value="">Selecione o plano</option>
                  {(plans as ClientPlan[]).map(p => (
                    <option key={p.id} value={p.id}>{p.name} — R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/{p.billingCycle === 'monthly' ? 'mês' : 'sem'}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-muted-foreground">O pagamento é processado via Asaas. O cliente receberá um link para cadastrar o cartão de crédito.</p>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? 'Criando...' : 'Criar assinatura'}
                </button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── Tab: Planos ──────────────────────────────────────────────────────────────
function PlansTab() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState<ClientPlan | null>(null);

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => subscriptionApi.plans(true).then(r => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => subscriptionApi.togglePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Novo Plano
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-1">Nenhum plano criado</p>
          <p className="text-sm text-muted-foreground">Crie o primeiro plano de assinatura para seus clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(plans as ClientPlan[]).map(plan => (
            <div key={plan.id} className={`bg-card border rounded-xl p-5 flex flex-col gap-3 transition-colors ${plan.isActive ? 'border-border' : 'border-border opacity-60'} ${plan.isFeatured ? 'ring-1 ring-yellow-500/40' : ''}`}>
              {plan.isFeatured && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-500 -mt-1">
                  <Zap className="w-3 h-3" /> Destaque no portal
                </div>
              )}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{plan.name}</p>
                  <p className="text-2xl font-bold text-primary mt-1">
                    R$ {Number(plan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <span className="text-sm font-normal text-muted-foreground">/{plan.billingCycle === 'monthly' ? 'mês' : 'sem'}</span>
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${plan.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                  {plan.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              {plan.description && (
                <p className="text-xs text-muted-foreground">{plan.description}</p>
              )}

              <div className="flex flex-wrap gap-1.5">
                {plan.services.map(s => (
                  <span key={s.serviceId} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {s.service.name}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border mt-auto">
                <span className="text-xs text-muted-foreground">
                  {plan._count?.subscriptions ?? 0} assinante{(plan._count?.subscriptions ?? 0) !== 1 ? 's' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditing(plan)}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleMutation.mutate(plan.id)}
                    disabled={toggleMutation.isPending}
                    className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    title={plan.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {plan.isActive
                      ? <ToggleRight className="w-4 h-4 text-primary" />
                      : <ToggleLeft className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <PlanModal onClose={() => setShowCreate(false)} />}
      {editing    && <PlanModal plan={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

// ─── Tab: Assinantes ──────────────────────────────────────────────────────────
function SubscribersTab() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<SubStatus | ''>('');
  const [showSubscribe, setShowSubscribe] = useState(false);

  const { data: subs = [], isLoading } = useQuery({
    queryKey: ['subscriptions', filterStatus],
    queryFn: () => subscriptionApi.subscriptions(filterStatus || undefined).then(r => r.data),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => subscriptionApi.cancel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subscriptions'] }),
  });

  return (
    <>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
          className="h-9 px-3 text-sm bg-card border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativos</option>
          <option value="DEFAULTING">Inadimplentes</option>
          <option value="CANCELED">Cancelados</option>
          <option value="SUSPENDED">Suspensos</option>
        </select>
        <button onClick={() => setShowSubscribe(true)} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
          <Plus className="w-4 h-4" /> Assinar cliente
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (subs as ClientSubscription[]).length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Users className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium">Nenhuma assinatura encontrada</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="divide-y divide-border">
            {(subs as ClientSubscription[]).map(sub => {
              const st = statusLabel[sub.status];
              return (
                <div key={sub.id} className="flex items-center gap-4 px-4 py-3 hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{sub.client.name}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {sub.clientPlan.name} · R$ {Number(sub.clientPlan.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/{sub.clientPlan.billingCycle === 'monthly' ? 'mês' : 'sem'}
                    </p>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <p className="text-xs text-muted-foreground">Próximo pagamento</p>
                    <p className="text-xs font-medium text-foreground">
                      {sub.nextPaymentAt
                        ? format(new Date(sub.nextPaymentAt), "dd 'de' MMM", { locale: ptBR })
                        : '—'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {sub.paymentLink && sub.status !== 'ACTIVE' && (
                      <a
                        href={sub.paymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Link de pagamento"
                        className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {sub.status !== 'CANCELED' && (
                      <button
                        onClick={() => {
                          if (confirm(`Cancelar assinatura de ${sub.client.name}?`)) {
                            cancelMutation.mutate(sub.id);
                          }
                        }}
                        disabled={cancelMutation.isPending}
                        title="Cancelar assinatura"
                        className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showSubscribe && <SubscribeModal onClose={() => setShowSubscribe(false)} />}
    </>
  );
}

// ─── Card de ativação do módulo de cobranças ──────────────────────────────────
function ActivationCard() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleActivate = async () => {
    setLoading(true); setError('');
    try {
      const { data } = await paymentApi.activate();
      if (data.onboardingUrl) {
        window.open(data.onboardingUrl, '_blank');
      }
    } catch (err: any) {
      const msg = err.response?.data?.error ?? '';
      if (msg.includes('CNPJ_ALREADY_IN_USE')) {
        setError('Este CNPJ já possui uma conta Asaas vinculada a outro cadastro. Entre em contato com o suporte.');
      } else {
        setError(msg || 'Erro ao ativar. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Assinaturas</h1>
        <p className="text-muted-foreground text-sm">Planos recorrentes para seus clientes</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8 flex flex-col items-center text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Ative o módulo de cobranças</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Para criar planos e cobrar seus clientes automaticamente via cartão de crédito, você precisa ativar sua conta de pagamentos.
            O processo leva menos de 5 minutos e é feito diretamente com o Asaas.
          </p>
        </div>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground w-full max-w-sm">
          {['Cobranças automáticas via cartão', 'Link de pagamento para o cliente', 'Saque via PIX para seu CNPJ'].map(item => (
            <div key={item} className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          onClick={handleActivate}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Ativando...</>
          ) : (
            <><Zap className="w-4 h-4" /> Ativar módulo de cobranças</>
          )}
        </button>

        <p className="text-xs text-muted-foreground">
          Você será redirecionado para o Asaas para completar o cadastro com seus documentos.
        </p>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AssinaturasPage() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId ?? '';

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ['barbershop-settings', barbershopId],
    queryFn: () => barbershopApi.getSettings(barbershopId).then(r => r.data),
    enabled: !!barbershopId,
  });

  const { data: reports } = useQuery({
    queryKey: ['subscription-reports'],
    queryFn: () => subscriptionApi.reports().then(r => r.data),
  });

  const kpis = [
    { label: 'Receita Recorrente (MRR)', value: `R$ ${(reports?.mrr ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: <CreditCard className="w-5 h-5" />, cls: 'text-primary' },
    { label: 'Assinantes ativos',        value: reports?.activeCount ?? '—',     icon: <Users className="w-5 h-5" />,    cls: 'text-emerald-500' },
    { label: 'Inadimplentes',            value: reports?.defaultingCount ?? '—', icon: <AlertTriangle className="w-5 h-5" />, cls: 'text-yellow-500' },
    { label: 'Cancelamentos este mês',   value: reports?.canceledThisMonth ?? '—', icon: <Repeat2 className="w-5 h-5" />, cls: 'text-destructive' },
  ];

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings?.asaasActivated) {
    return <ActivationCard />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Assinaturas</h1>
        <p className="text-muted-foreground text-sm">Planos recorrentes para seus clientes</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4 space-y-2">
            <div className={`${k.cls}`}>{k.icon}</div>
            <p className={`text-2xl font-bold ${k.cls}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="plans">
        <Tabs.List className="flex gap-1 bg-muted/50 p-1 rounded-lg w-fit mb-6">
          {[
            { value: 'plans', label: 'Planos' },
            { value: 'subscribers', label: 'Assinantes' },
          ].map(tab => (
            <Tabs.Trigger
              key={tab.value}
              value={tab.value}
              className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              {tab.label}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <Tabs.Content value="plans">
          <PlansTab />
        </Tabs.Content>
        <Tabs.Content value="subscribers">
          <SubscribersTab />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  );
}
