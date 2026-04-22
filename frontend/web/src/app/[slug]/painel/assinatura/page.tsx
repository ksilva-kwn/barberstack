'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  CreditCard, Check, Loader2, AlertCircle, CheckCircle2,
  ExternalLink, CalendarClock, ShieldCheck, X, Sparkles, ArrowRight, Zap,
} from 'lucide-react';
import { portalApi, PublicPlan, ClientSubscription } from '@/lib/public.api';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

const fmtDate = (d: string) =>
  format(new Date(d), "d 'de' MMMM 'de' yyyy", { locale: ptBR });

// ─── Badge Asaas ──────────────────────────────────────────────────────────────
function AsaasBadge() {
  return (
    <a
      href="https://www.asaas.com"
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
    >
      <span>Serviços financeiros processados por</span>
      <img
        src="https://baas.asaas.com/selos/Servicos_financeiros_Asaas-Reduzida-Positivo.svg?id=2af74ea1-31d2-4c5c-a544-7cfd4e879fcc"
        alt="Serviços financeiros Asaas"
        className="h-10 object-contain"
      />
    </a>
  );
}

// ─── Modal de confirmação ──────────────────────────────────────────────────────
function ConfirmModal({
  plan,
  hasSub,
  open,
  onClose,
  onConfirm,
  loading,
}: {
  plan: PublicPlan | null;
  hasSub: boolean;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}) {
  // Fecha ao pressionar Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!plan) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl border border-border',
          'shadow-2xl transition-transform duration-300 ease-out',
          'max-w-lg mx-auto',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
        </div>

        <div className="px-6 pb-8 pt-4 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {hasSub ? 'Trocar de plano' : 'Confirmar assinatura'}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {hasSub
                  ? 'Seu plano atual será cancelado'
                  : 'Você será redirecionado para inserir o cartão'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-accent/50 transition-colors text-muted-foreground"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Card do plano */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-bold text-foreground text-lg">{plan.name}</p>
                {plan.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{plan.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-bold text-primary">{fmt(Number(plan.price))}</p>
                <p className="text-xs text-muted-foreground">
                  /{plan.billingCycle === 'monthly' ? 'mês' : 'semana'}
                </p>
              </div>
            </div>

            {plan.services.length > 0 && (
              <div className="space-y-2 border-t border-border pt-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Incluso no plano
                </p>
                {plan.services.map((s: any) => (
                  <div key={s.service.id} className="flex items-center gap-2.5 text-sm">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span>{s.service.name}</span>
                    {s.limitPerCycle && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {s.limitPerCycle}× por ciclo
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info pagamento */}
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
            <p>
              Após confirmar, você será direcionado para uma página segura do Asaas
              para inserir seu cartão de crédito. Nenhum dado é armazenado por nós.
            </p>
          </div>

          {/* Botão confirmar */}

          <button
            onClick={onConfirm}
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
              : <><CreditCard className="w-5 h-5" /> {hasSub ? 'Confirmar troca' : 'Confirmar e pagar'} <ArrowRight className="w-4 h-4" /></>
            }
          </button>

          <AsaasBadge />
        </div>
      </div>
    </>
  );
}

// ─── Card do plano ativo ───────────────────────────────────────────────────────
function ActivePlanCard({
  sub,
  onCancel,
  canceling,
}: {
  sub: ClientSubscription;
  onCancel: () => void;
  canceling: boolean;
}) {
  const isCanceling = sub.status === 'CANCELING';
  const isPending   = sub.status === 'PENDING_PAYMENT';

  const borderColor = isCanceling ? 'border-amber-500/30' : isPending ? 'border-blue-500/30' : 'border-primary/30';
  const headerBg    = isCanceling
    ? 'bg-gradient-to-r from-amber-500/15 to-amber-500/5'
    : isPending
      ? 'bg-gradient-to-r from-blue-500/15 to-blue-500/5'
      : 'bg-gradient-to-r from-primary/20 to-primary/5';
  const iconColor   = isCanceling ? 'text-amber-500' : isPending ? 'text-blue-500' : 'text-primary';
  const iconBg      = isCanceling ? 'bg-amber-500/20' : isPending ? 'bg-blue-500/20' : 'bg-primary/20';

  return (
    <div className={cn('rounded-2xl border overflow-hidden', borderColor)}>
      {/* Header colorido */}
      <div className={cn('px-5 py-4', headerBg)}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
              <CreditCard className={cn('w-5 h-5', iconColor)} />
            </div>
            <div>
              <p className="font-bold text-foreground">{sub.clientPlan.name}</p>
              <p className="text-sm text-muted-foreground">
                {fmt(Number(sub.clientPlan.price))}
                {' / '}
                {sub.clientPlan.billingCycle === 'monthly' ? 'mês' : 'semana'}
              </p>
            </div>
          </div>

          {/* Badge status */}
          {isCanceling ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-500/20 text-amber-500 border border-amber-500/30 shrink-0">
              <CalendarClock className="w-3 h-3" /> Cancelando
            </span>
          ) : isPending ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-500/20 text-blue-500 border border-blue-500/30 shrink-0">
              <Loader2 className="w-3 h-3 animate-spin" /> Aguardando pagamento
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Ativo
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Aguardando pagamento */}
        {isPending && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <CreditCard className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-500">
                Pagamento pendente
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Insira seu cartão para ativar o plano. Seus benefícios começam após a confirmação.
              </p>
            </div>
          </div>
        )}

        {/* Aviso cancelamento */}
        {isCanceling && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <CalendarClock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                Assinatura cancelada — sem novas cobranças
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Acesso garantido até <strong>{fmtDate(sub.currentPeriodEnd)}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* Inadimplente */}
        {sub.status === 'DEFAULTING' && (
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-500">Pagamento pendente</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Regularize para continuar usando os benefícios do plano.
              </p>
            </div>
          </div>
        )}

        {/* Serviços */}
        {sub.clientPlan.services.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Serviços incluídos
            </p>
            {sub.clientPlan.services.map((s: any) => (
              <div key={s.service.id} className="flex items-center gap-2.5 text-sm">
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-emerald-500" />
                </div>
                <span>{s.service.name}</span>
                {s.limitPerCycle && (
                  <span className="ml-auto text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {s.limitPerCycle}× por ciclo
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Período */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
          <ShieldCheck className="w-4 h-4 text-muted-foreground shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">
              {isCanceling ? 'Acesso até' : 'Renovação em'}
            </p>
            <p className="text-sm font-semibold text-foreground">
              {fmtDate(sub.currentPeriodEnd)}
            </p>
          </div>
        </div>

        {/* Pagar */}
        {sub.paymentLink && (
          <a
            href={sub.paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {sub.status === 'DEFAULTING' ? 'Regularizar pagamento' : 'Inserir cartão de crédito'}
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>
        )}

        {/* Cancelar — não mostra em PENDING_PAYMENT nem CANCELING */}
        {!isCanceling && !isPending && (
          <button
            onClick={onCancel}
            disabled={canceling}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
          >
            {canceling
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <X className="w-3.5 h-3.5" />}
            {canceling ? 'Cancelando...' : 'Cancelar assinatura'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Card de plano disponível ──────────────────────────────────────────────────
function PlanCard({
  plan,
  isCurrent,
  hasSub,
  isFeaturedFallback,
  onClick,
}: {
  plan: PublicPlan;
  isCurrent: boolean;
  hasSub: boolean;
  isFeaturedFallback: boolean;
  onClick: () => void;
}) {
  const showFeatured = plan.isFeatured || isFeaturedFallback;

  return (
    <button
      onClick={isCurrent ? undefined : onClick}
      className={cn(
        'w-full text-left rounded-2xl border p-5 space-y-4 transition-all',
        isCurrent
          ? 'border-primary/40 bg-primary/5 cursor-default'
          : showFeatured
            ? 'border-yellow-500/40 bg-yellow-500/5 hover:border-yellow-500/60 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer'
            : 'border-border bg-card hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 cursor-pointer',
      )}
    >
      {/* Badge destaque */}
      {showFeatured && !isCurrent && (
        <div className="flex items-center gap-1.5 -mb-1">
          <Zap className="w-3.5 h-3.5 text-yellow-500" />
          <span className="text-xs font-bold text-yellow-500 uppercase tracking-wider">
            {plan.isFeatured ? 'Destaque' : 'Mais popular'}
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground">{plan.name}</span>
            {isCurrent && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                Plano atual
              </span>
            )}
          </div>
          {plan.description && (
            <p className="text-xs text-muted-foreground">{plan.description}</p>
          )}
          <div className="flex items-baseline gap-1">
            <span className={cn('text-2xl font-bold', showFeatured && !isCurrent ? 'text-yellow-500' : 'text-primary')}>
              {fmt(Number(plan.price))}
            </span>
            <span className="text-sm text-muted-foreground">
              /{plan.billingCycle === 'monthly' ? 'mês' : 'semana'}
            </span>
          </div>
        </div>

        {!isCurrent && (
          <div className={cn(
            'shrink-0 w-9 h-9 rounded-full flex items-center justify-center',
            showFeatured ? 'bg-yellow-500/15 text-yellow-500' : 'bg-primary/10 text-primary',
          )}>
            <ArrowRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {plan.services.length > 0 && (
        <div className="space-y-2 border-t border-border pt-3">
          {plan.services.map((s: any) => (
            <div key={s.service.id} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>{s.service.name}</span>
              {s.limitPerCycle && (
                <span className="ml-auto text-xs bg-muted px-2 py-0.5 rounded-full">
                  {s.limitPerCycle}×
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AssinaturaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const qc       = useQueryClient();
  const [auth, setAuth]       = useState<{ token: string; user: any } | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PublicPlan | null>(null);
  const [modalOpen, setModalOpen]       = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (!raw) { router.replace(`/${slug}/entrar`); return; }
    setAuth(JSON.parse(raw));
  }, [slug]);

  const { data: sub, isLoading: loadingSub } = useQuery({
    queryKey: ['my-subscription', slug],
    queryFn: () => portalApi.mySubscription(auth!.token, slug).then(r => r.data),
    enabled: !!auth?.token,
  });

  const { data: plans = [], isLoading: loadingPlans } = useQuery({
    queryKey: ['public-plans', slug],
    queryFn: () => portalApi.plans(slug).then(r => r.data),
    enabled: !!slug,
  });

  const subscribe = useMutation({
    mutationFn: (planId: string) => portalApi.subscribe(auth!.token, auth!.user.id, planId),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['my-subscription', slug] });
      setModalOpen(false);
      setSelectedPlan(null);

      const data = res.data as ClientSubscription;
      if (data?.paymentLink) {
        setSuccess('__LINK__:' + data.paymentLink);
      } else {
        setSuccess('Assinatura criada! Em breve você receberá um link de pagamento.');
        setTimeout(() => setSuccess(''), 6000);
      }
    },
    onError: (err: any) => {
      setModalOpen(false);
      setError(err.response?.data?.error ?? 'Erro ao assinar. Tente novamente.');
      setTimeout(() => setError(''), 5000);
    },
  });

  const cancel = useMutation({
    mutationFn: () => portalApi.cancelSubscription(auth!.token, sub!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscription', slug] });
      setSuccess('Assinatura cancelada. Você mantém o acesso até o fim do período.');
      setTimeout(() => setSuccess(''), 6000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Erro ao cancelar.');
      setTimeout(() => setError(''), 4000);
    },
  });

  if (!auth) return null;

  const isLoading = loadingSub || loadingPlans;
  const hasSub      = !!sub && sub.status !== 'CANCELED';
  const isCanceling = sub?.status === 'CANCELING';
  const isPending   = sub?.status === 'PENDING_PAYMENT';

  // Lógica de destaque: usa isFeatured manual; fallback = primeiro plano ativo se nenhum marcado
  const anyFeatured = (plans as PublicPlan[]).some(p => p.isFeatured);
  const fallbackFeaturedId = !anyFeatured && plans.length > 0 ? (plans as PublicPlan[])[0].id : null;

  const paymentLink = success.startsWith('__LINK__:')
    ? success.replace('__LINK__:', '')
    : null;

  function openModal(plan: PublicPlan) {
    setSelectedPlan(plan);
    setModalOpen(true);
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Assinatura</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Gerencie seu plano de cortes</p>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Sucesso simples */}
        {success && !paymentLink && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
          </div>
        )}

        {/* Sucesso com payment link */}
        {paymentLink && (
          <div className="p-5 rounded-2xl bg-primary/10 border border-primary/30 space-y-4">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <CheckCircle2 className="w-5 h-5" />
              Assinatura criada com sucesso!
            </div>
            <p className="text-sm text-muted-foreground">
              Para ativar seu plano, insira seu cartão na página segura do Asaas.
              Nenhum dado fica armazenado conosco.
            </p>
            <a
              href={paymentLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              Inserir cartão e ativar plano
              <ExternalLink className="w-4 h-4 opacity-70" />
            </a>
            <button
              onClick={() => setSuccess('')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            >
              Fechar
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Plano ativo */}
            {hasSub && sub && (
              <ActivePlanCard
                sub={sub}
                onCancel={() => cancel.mutate()}
                canceling={cancel.isPending}
              />
            )}

            {/* Planos disponíveis — esconde quando tem pendente ou cancelando */}
            {plans.length > 0 && !isCanceling && !isPending && (
              <section className="space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    {hasSub ? 'Trocar de plano' : 'Planos disponíveis'}
                  </h2>
                </div>
                {(plans as PublicPlan[]).map((plan: PublicPlan) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isCurrent={sub?.clientPlanId === plan.id}
                    hasSub={hasSub}
                    isFeaturedFallback={plan.id === fallbackFeaturedId}
                    onClick={() => openModal(plan)}
                  />
                ))}
              </section>
            )}

            {/* Nenhum plano */}
            {plans.length === 0 && !hasSub && (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                  <CreditCard className="w-8 h-8 text-muted-foreground opacity-40" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Nenhum plano disponível</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A barbearia ainda não cadastrou planos de assinatura.
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Asaas badge */}
      <div className="pt-2 pb-4">
        <AsaasBadge />
      </div>

      {/* Modal de confirmação */}
      <ConfirmModal
        plan={selectedPlan}
        hasSub={hasSub}
        open={modalOpen}
        onClose={() => { if (!subscribe.isPending) { setModalOpen(false); } }}
        onConfirm={() => { if (selectedPlan) subscribe.mutate(selectedPlan.id); }}
        loading={subscribe.isPending}
      />
    </>
  );
}
