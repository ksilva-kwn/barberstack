'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { authApi, RegisterBarbershopPayload } from '@/lib/auth.api';
import { useAuthStore } from '@/store/auth.store';

// ─── helpers ────────────────────────────────────────────────────────────────

function maskCNPJ(v: string) {
  return v
    .replace(/\D/g, '')
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10)
    return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trimEnd();
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trimEnd();
}

function maskCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

// ─── types ───────────────────────────────────────────────────────────────────

interface FormData {
  // step 1 – barbearia
  barbershopName: string;
  document: string;       // CNPJ formatado
  barbershopPhone: string;
  barbershopEmail: string;
  cep: string;
  address: string;
  city: string;
  state: string;
  // step 2 – dono
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
}

const empty: FormData = {
  barbershopName: '', document: '', barbershopPhone: '', barbershopEmail: '',
  cep: '', address: '', city: '', state: '',
  name: '', email: '', password: '', confirmPassword: '', phone: '',
};

// ─── component ───────────────────────────────────────────────────────────────

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormData, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  // ── CNPJ auto-fill ──────────────────────────────────────────────────────
  const handleCNPJ = async (raw: string) => {
    const masked = maskCNPJ(raw);
    set('document', masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 14) return;

    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) return;
      const data = await res.json();
      set('barbershopName', data.razao_social ?? '');
      set('barbershopPhone', maskPhone(data.ddd_telefone_1 ?? ''));
      set('barbershopEmail', data.email ?? '');
      if (data.cep) handleCEP(data.cep);
    } catch {
      // silently ignore
    } finally {
      setCnpjLoading(false);
    }
  };

  // ── CEP auto-fill ────────────────────────────────────────────────────────
  const handleCEP = async (raw: string) => {
    const masked = maskCEP(raw);
    set('cep', masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.erro) return;
      set('address', `${data.logradouro ?? ''}${data.bairro ? ', ' + data.bairro : ''}`);
      set('city', data.localidade ?? '');
      set('state', data.uf ?? '');
    } catch {
      // silently ignore
    } finally {
      setCepLoading(false);
    }
  };

  // ── step 1 validation ────────────────────────────────────────────────────
  const validateStep1 = () => {
    if (!form.barbershopName.trim()) return 'Nome da barbearia obrigatório';
    if (form.document.replace(/\D/g, '').length !== 14) return 'CNPJ inválido';
    if (form.barbershopPhone.replace(/\D/g, '').length < 10) return 'Telefone inválido';
    if (!form.barbershopEmail.includes('@')) return 'E-mail da barbearia inválido';
    return '';
  };

  // ── step 2 validation ────────────────────────────────────────────────────
  const validateStep2 = () => {
    if (form.name.trim().length < 2) return 'Nome deve ter ao menos 2 caracteres';
    if (!form.email.includes('@')) return 'E-mail inválido';
    if (form.password.length < 6) return 'Senha deve ter ao menos 6 caracteres';
    if (form.password !== form.confirmPassword) return 'As senhas não conferem';
    return '';
  };

  const goNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError('');
    setSubmitting(true);

    const payload: RegisterBarbershopPayload = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone || undefined,
      barbershopName: form.barbershopName,
      document: form.document.replace(/\D/g, ''),
      barbershopPhone: form.barbershopPhone.replace(/\D/g, ''),
      barbershopEmail: form.barbershopEmail,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
    };

    try {
      const { data } = await authApi.registerBarbershop(payload);
      setAuth(data.token, data.refreshToken, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao criar conta. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Scissors className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-2xl text-foreground">Barberstack</span>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex-1 h-1 rounded-full ${step >= 1 ? 'bg-primary' : 'bg-border'}`} />
          <div className={`flex-1 h-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-border'}`} />
        </div>
        <p className="text-xs text-muted-foreground mb-4 text-center">
          {step === 1 ? 'Passo 1 de 2 — Dados da barbearia' : 'Passo 2 de 2 — Dados do responsável'}
        </p>

        <div className="bg-card border border-border rounded-xl p-8">
          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <h1 className="text-xl font-semibold text-foreground mb-4">Sua barbearia</h1>

              {/* CNPJ */}
              <Field label="CNPJ">
                <div className="relative">
                  <input
                    type="text"
                    value={form.document}
                    onChange={(e) => handleCNPJ(e.target.value)}
                    placeholder="00.000.000/0001-00"
                    className={inputCls}
                  />
                  {cnpjLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </Field>

              {/* Nome */}
              <Field label="Nome da barbearia">
                <input
                  type="text"
                  value={form.barbershopName}
                  onChange={(e) => set('barbershopName', e.target.value)}
                  placeholder="Ex: Barbearia do João"
                  className={inputCls}
                />
              </Field>

              {/* Telefone */}
              <Field label="Telefone da barbearia">
                <input
                  type="text"
                  value={form.barbershopPhone}
                  onChange={(e) => set('barbershopPhone', maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className={inputCls}
                />
              </Field>

              {/* E-mail */}
              <Field label="E-mail da barbearia">
                <input
                  type="email"
                  value={form.barbershopEmail}
                  onChange={(e) => set('barbershopEmail', e.target.value)}
                  placeholder="contato@barbearia.com"
                  className={inputCls}
                />
              </Field>

              {/* CEP */}
              <Field label="CEP">
                <div className="relative">
                  <input
                    type="text"
                    value={form.cep}
                    onChange={(e) => handleCEP(e.target.value)}
                    placeholder="00000-000"
                    className={inputCls}
                  />
                  {cepLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
                </div>
              </Field>

              {/* Endereço */}
              <Field label="Endereço">
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  placeholder="Rua, número, bairro"
                  className={inputCls}
                />
              </Field>

              {/* Cidade / Estado */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Cidade">
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="São Paulo"
                      className={inputCls}
                    />
                  </Field>
                </div>
                <Field label="UF">
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value.toUpperCase().slice(0, 2))}
                    placeholder="SP"
                    className={inputCls}
                  />
                </Field>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <button
                type="button"
                onClick={goNext}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Próximo
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h1 className="text-xl font-semibold text-foreground mb-4">Responsável pela conta</h1>

              {/* Nome */}
              <Field label="Seu nome">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                  placeholder="João Silva"
                  className={inputCls}
                />
              </Field>

              {/* E-mail */}
              <Field label="Seu e-mail">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  placeholder="seu@email.com"
                  className={inputCls}
                />
              </Field>

              {/* Telefone */}
              <Field label="Seu telefone (opcional)">
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => set('phone', maskPhone(e.target.value))}
                  placeholder="(11) 99999-9999"
                  className={inputCls}
                />
              </Field>

              {/* Senha */}
              <Field label="Senha">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {/* Confirmar senha */}
              <Field label="Confirmar senha">
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => set('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  className={inputCls}
                />
              </Field>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); }}
                  className="flex-1 py-2.5 rounded-lg border border-border text-foreground font-medium text-sm hover:bg-accent transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Criando conta...' : 'Criar conta'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── tiny helpers ─────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
