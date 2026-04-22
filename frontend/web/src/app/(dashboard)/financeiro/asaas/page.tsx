'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, ArrowRight, Building2, Check, CheckCircle2,
  ExternalLink, Loader2, RefreshCw, Wallet,
} from 'lucide-react';
import { paymentApi } from '@/lib/payment.api';
import { cn } from '@/lib/utils';

function StatusBadge({ label, ok, pending }: { label: string; ok?: boolean; pending?: boolean }) {
  if (ok) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
      <Check className="w-3 h-3" /> {label}
    </span>
  );
  if (pending) return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
      <Loader2 className="w-3 h-3 animate-spin" /> {label}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-muted text-muted-foreground border border-border">
      <AlertCircle className="w-3 h-3" /> {label}
    </span>
  );
}

export default function AsaasSetupPage() {
  const qc = useQueryClient();
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState('');
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);

  const { data: status, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['asaas-account-status'],
    queryFn: () => paymentApi.accountStatus().then(r => r.data),
    staleTime: 30_000,
  });

  const { data: urlData } = useQuery({
    queryKey: ['asaas-onboarding-url'],
    queryFn: () => paymentApi.onboardingUrl().then(r => r.data),
    enabled: !!status?.configured,
    staleTime: 60_000,
  });

  const currentUrl = onboardingUrl ?? urlData?.url ?? null;

  const handleOpenOnboarding = async () => {
    setActivating(true);
    setActivationError('');
    try {
      const res = await paymentApi.activate();
      const url = res.data.onboardingUrl;
      if (url) {
        setOnboardingUrl(url);
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        setActivationError('Link indisponível no momento. Tente novamente em alguns instantes.');
      }
      qc.invalidateQueries({ queryKey: ['asaas-account-status'] });
      qc.invalidateQueries({ queryKey: ['asaas-onboarding-url'] });
      qc.invalidateQueries({ queryKey: ['asaas-balance'] });
    } catch (err: any) {
      setActivationError(err.response?.data?.error ?? 'Erro ao buscar link. Tente novamente.');
    } finally {
      setActivating(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );

  // ── Conta não ativada ainda ───────────────────────────────────────────────────
  if (!status?.configured) {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ativar conta de pagamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure sua subconta Asaas para receber pagamentos de assinaturas.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Subconta Asaas (BaaS)</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sua barbearia terá uma conta de pagamentos própria. Os valores das
                assinaturas caem diretamente no seu saldo, sem intermediários.
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Receba assinaturas via cartão de crédito',
              'Saque via PIX direto para sua conta bancária',
              'Sem mensalidade — cobra apenas quando você cobra',
              'Dados financeiros protegidos pela Asaas',
            ].map(t => (
              <li key={t} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {t}
              </li>
            ))}
          </ul>

          {activationError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> {activationError}
            </div>
          )}

          <button
            onClick={handleOpenOnboarding}
            disabled={activating}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {activating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Abrindo...</>
              : <><Building2 className="w-4 h-4" /> Ativar e acessar cadastro <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>
      </div>
    );
  }

  // ── Conta ativada — mostrar status + link onboarding ─────────────────────────
  const bankOk      = status.bankAccountInfoProvided;
  const docApproved = status.documentStatus === 'APPROVED';
  const docPending  = status.documentStatus === 'AWAITING_APPROVAL';
  const docRejected = status.documentStatus === 'REJECTED';
  const fullyActive = status.status === 'ACTIVE';

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conta Asaas</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Situação do cadastro da sua subconta de pagamentos.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', isFetching && 'animate-spin')} />
          Atualizar
        </button>
      </div>

      {/* Status geral */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">Situação cadastral</p>
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label={fullyActive ? 'Conta ativa' : 'Cadastro pendente'}
            ok={fullyActive}
            pending={!fullyActive}
          />
          <StatusBadge
            label={bankOk ? 'Conta bancária cadastrada' : 'Conta bancária pendente'}
            ok={bankOk}
          />
          <StatusBadge
            label={docApproved ? 'Documentos aprovados' : docPending ? 'Documentos em análise' : docRejected ? 'Documento rejeitado' : 'Documentos pendentes'}
            ok={docApproved}
            pending={docPending}
          />
        </div>

        {fullyActive && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm text-emerald-500">
              Sua conta está ativa e pronta para receber pagamentos.
            </p>
          </div>
        )}

        {docRejected && (
          <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">
              Um ou mais documentos foram rejeitados. Acesse o link abaixo para reenviar.
            </p>
          </div>
        )}
      </div>

      {/* Onboarding link */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-foreground">Completar cadastro no Asaas</p>
          <p className="text-xs text-muted-foreground mt-1">
            Dados bancários e documentos são enviados diretamente na plataforma Asaas.
            O processo leva menos de 5 minutos.
          </p>
        </div>

        {/* O que vai acontecer */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border text-xs text-muted-foreground">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
          <p>
            Ao clicar no botão abaixo, <strong className="text-foreground">uma nova aba será aberta</strong> com
            o painel da Asaas já logado na sua conta. Preencha seus dados bancários e envie os documentos
            solicitados. Quando terminar, <strong className="text-foreground">feche a aba e volte para o Barberstack</strong> —
            clique em "Atualizar" para ver o novo status.
          </p>
        </div>

        <ul className="space-y-1.5 text-xs text-muted-foreground">
          {[
            'Informe sua conta bancária para receber saques',
            'Envie RG/CNH e comprovante de atividade',
            'Aguarde aprovação (normalmente 1 dia útil)',
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-4 h-4 rounded-full bg-primary/15 text-primary text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                {i + 1}
              </span>
              {t}
            </li>
          ))}
        </ul>

        {currentUrl ? (
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ir para o cadastro no Asaas
          </a>
        ) : (
          <button
            onClick={handleOpenOnboarding}
            disabled={activating}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50 transition-colors"
          >
            {activating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Abrindo...</>
              : <><ExternalLink className="w-4 h-4" /> Acessar cadastro no Asaas</>}
          </button>
        )}

        {activationError && (
          <p className="text-xs text-destructive">{activationError}</p>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Serviços financeiros fornecidos por{' '}
        <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
          Asaas
        </a>
        . Dados enviados diretamente à plataforma, nunca armazenados por nós.
      </p>
    </div>
  );
}
