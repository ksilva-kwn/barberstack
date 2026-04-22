'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle, ArrowRight, Building2, Check, CheckCircle2,
  ChevronLeft, ExternalLink, FileText, Loader2, Upload, Wallet,
} from 'lucide-react';
import { paymentApi, BankAccountData } from '@/lib/payment.api';
import { cn } from '@/lib/utils';

// ─── Brazilian banks (top 20) ────────────────────────────────────────────────
const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica Federal' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '422', name: 'Safra' },
  { code: '077', name: 'Inter' },
  { code: '260', name: 'Nu Pagamentos (Nubank)' },
  { code: '336', name: 'C6 Bank' },
  { code: '290', name: 'PagBank' },
  { code: '323', name: 'Mercado Pago' },
  { code: '756', name: 'Sicoob' },
  { code: '748', name: 'Sicredi' },
  { code: '041', name: 'Banrisul' },
  { code: '655', name: 'Votorantim' },
  { code: '212', name: 'Banco Original' },
  { code: '208', name: 'BTG Pactual' },
  { code: '707', name: 'Daycoval' },
  { code: '643', name: 'Pine' },
  { code: '021', name: 'Banestes' },
];

const DOCUMENT_TYPES = [
  { value: 'IDENTIFICATION', label: 'RG ou CNH (frente)' },
  { value: 'IDENTIFICATION_BACK', label: 'RG ou CNH (verso)' },
  { value: 'SOCIAL_CONTRACT', label: 'Contrato Social' },
  { value: 'CNPJ_CARD', label: 'Cartão CNPJ' },
  { value: 'ACTIVITY_PROOF', label: 'Comprovante de atividade' },
  { value: 'ADDRESS_PROOF', label: 'Comprovante de endereço' },
];

const inputCls = 'w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';
const labelCls = 'block text-sm font-medium text-foreground mb-1';

// ─── Step indicator ───────────────────────────────────────────────────────────
function Steps({ current }: { current: number }) {
  const steps = ['Conta bancária', 'Documentos', 'Concluído'];
  return (
    <div className="flex items-center gap-2">
      {steps.map((label, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
            i < current
              ? 'bg-emerald-500 text-white'
              : i === current
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground',
          )}>
            {i < current ? <Check className="w-3.5 h-3.5" /> : i + 1}
          </div>
          <span className={cn(
            'text-xs font-medium hidden sm:block',
            i === current ? 'text-foreground' : 'text-muted-foreground',
          )}>{label}</span>
          {i < steps.length - 1 && (
            <div className={cn('w-6 h-px mx-1', i < current ? 'bg-emerald-500' : 'bg-border')} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 1 — Bank account ─────────────────────────────────────────────────
function BankAccountStep({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<BankAccountData>({
    bankCode: '',
    bankName: '',
    ownerName: '',
    cpfCnpj: '',
    agency: '',
    account: '',
    accountDigit: '',
    bankAccountType: 'CONTA_CORRENTE',
  });
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: () => paymentApi.submitBankAccount(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['asaas-account-status'] });
      onDone();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Erro ao salvar dados bancários. Verifique os campos e tente novamente.');
    },
  });

  const set = (k: keyof BankAccountData, v: string) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleBankChange = (code: string) => {
    const bank = BANKS.find(b => b.code === code);
    set('bankCode', code);
    set('bankName', bank?.name ?? '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.bankCode || !form.ownerName || !form.cpfCnpj || !form.agency || !form.account) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    mutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">Dados bancários</h2>
        <p className="text-sm text-muted-foreground">
          Informe a conta onde você receberá os saques. O CNPJ/CPF deve ser o mesmo titular da conta.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Bank selector */}
      <div>
        <label className={labelCls}>Banco <span className="text-destructive">*</span></label>
        <select
          className={inputCls}
          value={form.bankCode}
          onChange={e => handleBankChange(e.target.value)}
          required
        >
          <option value="">Selecione o banco</option>
          {BANKS.map(b => (
            <option key={b.code} value={b.code}>{b.code} – {b.name}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Agência <span className="text-destructive">*</span></label>
          <input className={inputCls} value={form.agency} onChange={e => set('agency', e.target.value)}
            placeholder="0001" maxLength={10} required />
        </div>
        <div>
          <label className={labelCls}>Conta <span className="text-destructive">*</span></label>
          <div className="flex gap-2">
            <input className={inputCls} value={form.account} onChange={e => set('account', e.target.value)}
              placeholder="00000" maxLength={20} required />
            <input className={cn(inputCls, 'w-16 shrink-0')} value={form.accountDigit}
              onChange={e => set('accountDigit', e.target.value)} placeholder="0" maxLength={2} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Conta · Dígito</p>
        </div>
      </div>

      <div>
        <label className={labelCls}>Tipo de conta</label>
        <div className="flex gap-3">
          {(['CONTA_CORRENTE', 'CONTA_POUPANCA'] as const).map(t => (
            <button
              key={t}
              type="button"
              onClick={() => set('bankAccountType', t)}
              className={cn(
                'flex-1 py-2 rounded-lg border text-sm font-medium transition-colors',
                form.bankAccountType === t
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border text-muted-foreground hover:bg-accent',
              )}
            >
              {t === 'CONTA_CORRENTE' ? 'Corrente' : 'Poupança'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className={labelCls}>Nome do titular <span className="text-destructive">*</span></label>
        <input className={inputCls} value={form.ownerName} onChange={e => set('ownerName', e.target.value)}
          placeholder="Nome completo ou razão social" required />
      </div>

      <div>
        <label className={labelCls}>CPF / CNPJ do titular <span className="text-destructive">*</span></label>
        <input className={inputCls} value={form.cpfCnpj} onChange={e => set('cpfCnpj', e.target.value)}
          placeholder="00.000.000/0001-00 ou 000.000.000-00" required />
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
      >
        {mutation.isPending
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Salvando...</>
          : <>Continuar <ArrowRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}

// ─── Step 2 — Documents ───────────────────────────────────────────────────────
function DocumentsStep({ onDone, onBack }: { onDone: () => void; onBack: () => void }) {
  const [uploads, setUploads] = useState<Record<string, { file: File; status: 'idle' | 'uploading' | 'done' | 'error'; error?: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeType, setActiveType] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeType) return;
    e.target.value = '';

    setUploads(u => ({ ...u, [activeType]: { file, status: 'uploading' } }));
    try {
      await paymentApi.uploadDocument(activeType, file);
      setUploads(u => ({ ...u, [activeType]: { file, status: 'done' } }));
    } catch (err: any) {
      const msg = err.response?.data?.error ?? 'Erro no upload';
      setUploads(u => ({ ...u, [activeType]: { file, status: 'error', error: msg } }));
    }
  };

  const triggerUpload = (type: string) => {
    setActiveType(type);
    setTimeout(() => fileInputRef.current?.click(), 50);
  };

  const doneCount = Object.values(uploads).filter(u => u.status === 'done').length;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-lg font-bold text-foreground">Documentos</h2>
        <p className="text-sm text-muted-foreground">
          Envie os documentos necessários para validar sua conta. Pelo menos 1 documento é obrigatório.
          Formatos aceitos: JPG, PNG, PDF.
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.pdf"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="space-y-3">
        {DOCUMENT_TYPES.map(doc => {
          const up = uploads[doc.value];
          return (
            <div key={doc.value} className={cn(
              'flex items-center gap-3 p-4 rounded-xl border transition-colors',
              up?.status === 'done'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : up?.status === 'error'
                  ? 'border-destructive/30 bg-destructive/5'
                  : 'border-border bg-card',
            )}>
              <div className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
                up?.status === 'done' ? 'bg-emerald-500/15 text-emerald-500' : 'bg-muted text-muted-foreground',
              )}>
                {up?.status === 'done'
                  ? <Check className="w-4 h-4" />
                  : up?.status === 'uploading'
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <FileText className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{doc.label}</p>
                {up?.status === 'done' && (
                  <p className="text-xs text-emerald-500 truncate">{up.file.name}</p>
                )}
                {up?.status === 'error' && (
                  <p className="text-xs text-destructive">{up.error}</p>
                )}
                {up?.status === 'uploading' && (
                  <p className="text-xs text-muted-foreground">Enviando...</p>
                )}
              </div>
              <button
                onClick={() => triggerUpload(doc.value)}
                disabled={up?.status === 'uploading'}
                className={cn(
                  'shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  up?.status === 'done'
                    ? 'bg-muted text-muted-foreground hover:bg-accent'
                    : 'bg-primary/10 text-primary hover:bg-primary/20',
                )}
              >
                <Upload className="w-3.5 h-3.5" />
                {up?.status === 'done' ? 'Trocar' : 'Enviar'}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={onDone}
          disabled={doneCount === 0}
          className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {doneCount > 0
            ? <><Check className="w-4 h-4" /> Continuar com {doneCount} documento{doneCount > 1 ? 's' : ''}</>
            : 'Envie pelo menos 1 documento'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3 — Done ────────────────────────────────────────────────────────────
function DoneStep({ onboardingUrl }: { onboardingUrl: string | null }) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-500" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-foreground">Dados enviados!</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Seus dados bancários e documentos foram submetidos ao Asaas para análise.
          O processo pode levar até 1 dia útil.
        </p>
      </div>

      <div className="w-full p-4 rounded-xl bg-primary/10 border border-primary/20 text-left space-y-2">
        <p className="text-sm font-semibold text-foreground">Próximos passos</p>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            Asaas vai analisar seus documentos
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            Você receberá um e-mail quando a conta for aprovada
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            Após aprovação, os pagamentos serão processados automaticamente
          </li>
        </ul>
      </div>

      {onboardingUrl && (
        <a
          href={onboardingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 w-full py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors justify-center"
        >
          <ExternalLink className="w-4 h-4" />
          Abrir painel Asaas para acompanhar
        </a>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function AsaasSetupPage() {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);
  const [onboardingUrl, setOnboardingUrl] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState('');

  const { data: status, isLoading } = useQuery({
    queryKey: ['asaas-account-status'],
    queryFn: () => paymentApi.accountStatus().then(r => r.data),
    staleTime: 30_000,
  });

  const handleActivate = async () => {
    setActivating(true);
    setActivationError('');
    try {
      const res = await paymentApi.activate();
      setOnboardingUrl(res.data.onboardingUrl);
      qc.invalidateQueries({ queryKey: ['asaas-account-status'] });
      qc.invalidateQueries({ queryKey: ['asaas-balance'] });
    } catch (err: any) {
      setActivationError(err.response?.data?.error ?? 'Erro ao ativar conta. Tente novamente.');
    } finally {
      setActivating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Not configured at all — needs to activate first
  if (!status?.configured) {
    return (
      <div className="space-y-6 max-w-lg">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ativar conta de pagamentos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure sua subconta Asaas para receber pagamentos de assinaturas dos clientes.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Subconta Asaas (White-Label)</p>
              <p className="text-sm text-muted-foreground mt-1">
                Sua barbearia terá uma conta de pagamentos própria. Os valores das assinaturas
                caem diretamente no seu saldo, sem intermediários.
              </p>
            </div>
          </div>

          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              'Receba assinaturas via cartão de crédito',
              'Saque via PIX direto para sua conta bancária',
              'Sem mensalidade — cobramos apenas quando você cobra',
              'Dados financeiros protegidos pela Asaas',
            ].map(t => (
              <li key={t} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                {t}
              </li>
            ))}
          </ul>

          {activationError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {activationError}
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={activating}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
          >
            {activating
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Ativando...</>
              : <><Building2 className="w-4 h-4" /> Ativar conta de pagamentos <ArrowRight className="w-4 h-4" /></>}
          </button>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Serviços financeiros fornecidos por{' '}
          <a href="https://www.asaas.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
            Asaas
          </a>
          . Ao ativar, você concorda com os termos da plataforma.
        </p>
      </div>
    );
  }

  // Configured — show wizard
  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Completar cadastro Asaas</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Informe seus dados bancários e envie os documentos para liberar saques.
        </p>
      </div>

      {/* Status chips */}
      <div className="flex flex-wrap gap-2">
        {status.bankAccountInfoProvided && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
            <Check className="w-3 h-3" /> Conta bancária cadastrada
          </span>
        )}
        {status.documentStatus === 'APPROVED' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
            <Check className="w-3 h-3" /> Documentos aprovados
          </span>
        )}
        {status.documentStatus === 'AWAITING_APPROVAL' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/20">
            <Loader2 className="w-3 h-3 animate-spin" /> Documentos em análise
          </span>
        )}
        {status.documentStatus === 'REJECTED' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20">
            <AlertCircle className="w-3 h-3" /> Documento rejeitado — reenvie
          </span>
        )}
        {onboardingUrl && (
          <a
            href={onboardingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> Abrir painel Asaas
          </a>
        )}
      </div>

      {step < 2 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-6">
            <Steps current={step} />
          </div>
          {step === 0 && (
            <BankAccountStep onDone={() => setStep(1)} />
          )}
          {step === 1 && (
            <DocumentsStep onDone={() => setStep(2)} onBack={() => setStep(0)} />
          )}
        </div>
      )}

      {step === 2 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <DoneStep onboardingUrl={onboardingUrl} />
        </div>
      )}
    </div>
  );
}
