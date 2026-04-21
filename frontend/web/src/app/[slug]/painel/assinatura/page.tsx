'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CreditCard, Check, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { portalApi, PublicPlan } from '@/lib/public.api';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

export default function AssinaturaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const qc       = useQueryClient();
  const [auth, setAuth]     = useState<{ token: string; user: any } | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null); // planId a confirmar
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscription', slug] });
      setConfirm(null);
      setSuccess('Assinatura realizada com sucesso!');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Erro ao assinar. Tente novamente.');
      setTimeout(() => setError(''), 4000);
    },
  });

  const cancel = useMutation({
    mutationFn: () => portalApi.cancelSubscription(auth!.token, sub!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscription', slug] });
      setSuccess('Assinatura cancelada.');
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Erro ao cancelar.');
      setTimeout(() => setError(''), 4000);
    },
  });

  if (!auth) return null;
  const isLoading = loadingSub || loadingPlans;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Assinatura</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Gerencie seu plano de cortes</p>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {success}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Plano ativo */}
          {sub && (
            <div className="p-5 rounded-2xl border border-primary/30 bg-primary/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground">{sub.clientPlan.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {fmt(Number(sub.clientPlan.price))} / {sub.clientPlan.billingCycle === 'monthly' ? 'mês' : 'semana'}
                  </p>
                </div>
                <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500">
                  Ativo
                </span>
              </div>

              {sub.clientPlan.services.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Serviços incluídos</p>
                  {sub.clientPlan.services.map((s: any) => (
                    <div key={s.service.id} className="flex items-center gap-2 text-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{s.service.name}</span>
                      {s.limitPerCycle && (
                        <span className="text-xs text-muted-foreground">({s.limitPerCycle}× por ciclo)</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {sub.currentPeriodEnd && (
                <p className="text-xs text-muted-foreground">
                  Período atual até {format(new Date(sub.currentPeriodEnd), "d 'de' MMMM", { locale: ptBR })}
                </p>
              )}

              {sub.paymentLink && (
                <a
                  href={sub.paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Pagar agora
                </a>
              )}

              <button
                onClick={() => cancel.mutate()}
                disabled={cancel.isPending}
                className="text-xs text-destructive hover:underline disabled:opacity-50"
              >
                {cancel.isPending ? 'Cancelando...' : 'Cancelar assinatura'}
              </button>
            </div>
          )}

          {/* Planos disponíveis */}
          {plans.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                {sub ? 'Trocar de plano' : 'Planos disponíveis'}
              </h2>
              <div className="space-y-3">
                {plans.map((plan: PublicPlan) => {
                  const isCurrent = sub?.clientPlanId === plan.id;
                  return (
                    <div
                      key={plan.id}
                      className={cn(
                        'p-5 rounded-2xl border transition-colors',
                        isCurrent ? 'border-primary/40 bg-primary/5' : 'border-border bg-card',
                      )}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5 flex-1">
                          <p className="font-bold text-foreground">{plan.name}</p>
                          {plan.description && (
                            <p className="text-xs text-muted-foreground">{plan.description}</p>
                          )}
                          <p className="text-lg font-bold text-primary">
                            {fmt(Number(plan.price))}
                            <span className="text-xs text-muted-foreground font-normal ml-1">
                              /{plan.billingCycle === 'monthly' ? 'mês' : 'semana'}
                            </span>
                          </p>
                          {plan.services.length > 0 && (
                            <div className="space-y-1 pt-1">
                              {plan.services.map((s: any) => (
                                <div key={s.service.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  {s.service.name}
                                  {s.limitPerCycle && ` (${s.limitPerCycle}×)`}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {isCurrent ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                            Plano atual
                          </span>
                        ) : confirm === plan.id ? (
                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => subscribe.mutate(plan.id)}
                              disabled={subscribe.isPending}
                              className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                            >
                              {subscribe.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmar'}
                            </button>
                            <button
                              onClick={() => setConfirm(null)}
                              className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent/30 transition-colors"
                            >
                              Voltar
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirm(plan.id)}
                            className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors shrink-0"
                          >
                            {sub ? 'Trocar' : 'Assinar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {plans.length === 0 && !sub && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <CreditCard className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
              <p className="font-medium text-foreground">Nenhum plano disponível</p>
              <p className="text-sm text-muted-foreground mt-1">A barbearia ainda não cadastrou planos de assinatura.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
