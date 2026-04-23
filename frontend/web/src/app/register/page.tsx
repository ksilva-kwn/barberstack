'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { authApi, RegisterBarbershopPayload } from '@/lib/auth.api';
import { useAuthStore } from '@/store/auth.store';

const A = '#D4A24C';
const G = {
  bg:           '#0B0A09',
  bgCard:       '#1A1714',
  bgCard2:      '#221E1A',
  border:       'rgba(255,240,210,0.06)',
  borderStrong: 'rgba(255,240,210,0.12)',
  text:         '#F5EFE4',
  textMuted:    '#A79E8F',
  textDim:      '#6B6459',
};

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 11.5, color: G.textMuted, fontWeight: 500, letterSpacing: '-0.01em' }}>{label}</span>
      {children}
    </label>
  );
}

function StyledInput({ value, onChange, placeholder, type = 'text', disabled, paddingRight, onFocus, onBlur }: {
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; type?: string; disabled?: boolean;
  paddingRight?: number;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', padding: '11px 14px', paddingRight: paddingRight,
        borderRadius: 10, background: G.bg, border: `1px solid ${G.borderStrong}`,
        color: G.text, fontSize: 14, outline: 'none',
        fontFamily: 'inherit', boxSizing: 'border-box',
        opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text',
        transition: 'border-color 0.2s',
      }}
      onFocus={e => { e.target.style.borderColor = A + '80'; onFocus?.(e); }}
      onBlur={e => { e.target.style.borderColor = G.borderStrong; onBlur?.(e); }}
    />
  );
}

function maskCNPJ(v: string) {
  return v.replace(/\D/g, '').slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}
function maskCPF(v: string) {
  return v.replace(/\D/g, '').slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}
function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 10) return d.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trimEnd();
  return d.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').trimEnd();
}
function maskCEP(v: string) {
  return v.replace(/\D/g, '').slice(0, 8).replace(/^(\d{5})(\d)/, '$1-$2');
}

interface FormData {
  documentType: 'cnpj' | 'cpf';
  barbershopName: string; document: string; barbershopPhone: string; barbershopEmail: string;
  cep: string; address: string; city: string; state: string;
  name: string; email: string; password: string; confirmPassword: string; phone: string;
  companyType: string;
}
const empty: FormData = {
  documentType: 'cnpj',
  barbershopName: '', document: '', barbershopPhone: '', barbershopEmail: '',
  cep: '', address: '', city: '', state: '',
  name: '', email: '', password: '', confirmPassword: '', phone: '',
  companyType: 'INDIVIDUAL',
};

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormData>(empty);
  const [showPassword, setShowPassword] = useState(false);
  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cnpjLocked, setCnpjLocked] = useState(false);
  const [cepLocked, setCepLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (field: keyof FormData, value: string) => setForm(f => ({ ...f, [field]: value }));

  const mapCompanyType = (porte: string): string => {
    const p = (porte ?? '').toUpperCase();
    if (p.includes('MEI')) return 'MEI';
    if (p.includes('MICRO') || p.includes('EPP') || p.includes('PEQUENO')) return 'LIMITED';
    return 'LIMITED';
  };

  const handleDocument = async (raw: string) => {
    const isCnpj = form.documentType === 'cnpj';
    const masked = isCnpj ? maskCNPJ(raw) : maskCPF(raw);
    set('document', masked);
    const digits = masked.replace(/\D/g, '');
    if (isCnpj && digits.length !== 14) { setCnpjLocked(false); return; }
    if (!isCnpj && digits.length !== 11) { setCnpjLocked(false); return; }
    if (!isCnpj) { setCnpjLocked(false); return; }
    setCnpjLoading(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) return;
      const data = await res.json();
      setForm(f => ({
        ...f,
        barbershopName:  data.razao_social ?? f.barbershopName,
        barbershopPhone: maskPhone(data.ddd_telefone_1 ?? f.barbershopPhone),
        barbershopEmail: data.email ?? f.barbershopEmail,
        companyType:     mapCompanyType(data.porte ?? ''),
      }));
      setCnpjLocked(true);
      if (data.cep) handleCEP(data.cep);
    } catch { /* ignore */ } finally { setCnpjLoading(false); }
  };

  const handleCEP = async (raw: string) => {
    const masked = maskCEP(raw); set('cep', masked);
    const digits = masked.replace(/\D/g, '');
    if (digits.length !== 8) { setCepLocked(false); return; }
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.erro) return;
      setForm(f => ({
        ...f,
        address: `${data.logradouro ?? ''}${data.bairro ? ', ' + data.bairro : ''}`,
        city: data.localidade ?? '',
        state: data.uf ?? '',
      }));
      setCepLocked(true);
    } catch { /* ignore */ } finally { setCepLoading(false); }
  };

  const validateStep1 = () => {
    if (!form.barbershopName.trim()) return 'Nome da barbearia obrigatório';
    const docDigits = form.document.replace(/\D/g, '');
    if (form.documentType === 'cnpj' && docDigits.length !== 14) return 'CNPJ inválido';
    if (form.documentType === 'cpf'  && docDigits.length !== 11)  return 'CPF inválido';
    if (form.barbershopPhone.replace(/\D/g, '').length < 10) return 'Telefone inválido';
    if (!form.barbershopEmail.includes('@')) return 'E-mail da barbearia inválido';
    return '';
  };
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
    setError(''); setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateStep2();
    if (err) { setError(err); return; }
    setError(''); setSubmitting(true);
    const payload: RegisterBarbershopPayload = {
      name: form.name, email: form.email, password: form.password,
      phone: form.phone || undefined, barbershopName: form.barbershopName,
      document: form.document.replace(/\D/g, ''),
      barbershopPhone: form.barbershopPhone.replace(/\D/g, ''),
      barbershopEmail: form.barbershopEmail,
      address: form.address || undefined, city: form.city || undefined, state: form.state || undefined,
      zipCode: form.cep.replace(/\D/g, '') || undefined,
      companyType: form.companyType || undefined,
    };
    try {
      const { data } = await authApi.registerBarbershop(payload);
      setAuth(data.token, data.refreshToken, data.user);
      router.push('/register/financeiro');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao criar conta. Tente novamente.');
    } finally { setSubmitting(false); }
  };

  const primaryBtn: React.CSSProperties = {
    padding: '13px 20px', borderRadius: 10, border: 'none',
    cursor: 'pointer',
    background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`,
    color: '#0B0A09', fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
    boxShadow: `0 1px 0 rgba(255,255,255,0.2) inset, 0 10px 30px -10px ${A}66`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    transition: 'opacity 0.2s',
  };
  const ghostBtn: React.CSSProperties = {
    padding: '13px 20px', borderRadius: 10,
    cursor: 'pointer', background: 'transparent',
    border: `1px solid ${G.borderStrong}`,
    color: G.textMuted, fontWeight: 500, fontSize: 14, fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  };

  return (
    <div style={{
      width: '100%', minHeight: '100vh', display: 'grid',
      gridTemplateColumns: 'clamp(300px, 45%, 560px) 1fr',
      background: G.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: G.text,
    }}>
      {/* ── Left: marketing panel ── */}
      <div style={{
        position: 'relative', padding: '44px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 30% 20%, ${A}22 0%, transparent 60%), linear-gradient(160deg, ${G.bgCard2} 0%, ${G.bg} 100%)`,
        borderRight: `1px solid ${G.border}`,
      }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5,
          backgroundImage: `repeating-linear-gradient(0deg, transparent 0 59px, ${G.border} 59px 60px)`,
        }} />

        {/* Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, position: 'relative' }}>
          <img src="/bzinho.png" alt="" style={{ width: 22, height: 22 * (183 / 148), objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em', color: G.text }}>
            barberstack
          </span>
        </div>

        {/* Headline */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.2em', color: A, textTransform: 'uppercase', marginBottom: 18 }}>
            — Sua barbearia, digital
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 'clamp(32px, 3.5vw, 44px)',
            fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1.05, margin: 0,
          }}>
            10 minutos para<br />
            <span style={{ fontStyle: 'italic', color: A }}>profissionalizar</span><br />
            sua barbearia.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: G.textMuted, marginTop: 22, maxWidth: 380 }}>
            Configure plano, profissionais e Asaas em um único fluxo. Comece a cobrar hoje.
          </p>

          {/* Feature chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 28 }}>
            {['Agenda online', 'Cobranças recorrentes', 'Comissões automáticas', 'Estoque inteligente'].map(f => (
              <span key={f} style={{
                padding: '5px 12px', borderRadius: 999, fontSize: 11.5, fontWeight: 500,
                background: `${A}14`, color: A, border: `1px solid ${A}30`,
              }}>{f}</span>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div style={{
          position: 'relative',
          background: `${G.bgCard}cc`, backdropFilter: 'blur(20px)',
          border: `1px solid ${G.border}`, borderRadius: 16, padding: 22,
        }}>
          <p style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 15, fontStyle: 'italic', lineHeight: 1.5, color: G.text, margin: 0 }}>
            "Em 10 minutos configurei tudo. No primeiro mês já recuperei o investimento."
          </p>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${A} 0%, ${G.bgCard2} 100%)`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Marcus Oliveira</div>
              <div style={{ fontSize: 11, color: G.textDim }}>Dono · Prime Cuts, RJ</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div style={{ padding: '44px 56px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 13, color: G.textMuted }}>
          Já tem conta?{' '}
          <Link href="/login" style={{ color: A, marginLeft: 8, fontWeight: 500, textDecoration: 'none' }}>
            Entrar →
          </Link>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 480, margin: '0 auto', width: '100%', paddingTop: 32 }}>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 2, borderRadius: 99, background: step >= 1 ? A : G.borderStrong }} />
            <div style={{ flex: 1, height: 2, borderRadius: 99, background: step >= 2 ? A : G.borderStrong }} />
          </div>
          <p style={{ fontSize: 11, color: G.textDim, marginBottom: 24, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            {step === 1 ? 'Passo 1 de 2 — Dados da barbearia' : 'Passo 2 de 2 — Dados do responsável'}
          </p>

          <h2 style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 30, fontWeight: 500, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            {step === 1 ? 'Sua barbearia' : 'Quem é o responsável?'}
          </h2>
          <p style={{ fontSize: 13.5, color: G.textMuted, marginBottom: 28 }}>
            {step === 1 ? 'CNPJ ou CPF — preenchemos o resto automaticamente.' : 'Sem cartão. Configure tudo em 10 minutos.'}
          </p>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Doc type selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['cnpj', 'cpf'] as const).map(type => (
                  <button key={type} type="button"
                    onClick={() => { setForm(f => ({ ...f, documentType: type, document: '' })); setCnpjLocked(false); }}
                    style={{
                      padding: '10px', borderRadius: 10, border: `1px solid ${form.documentType === type ? A : G.borderStrong}`,
                      background: form.documentType === type ? `${A}14` : 'transparent',
                      color: form.documentType === type ? A : G.textMuted,
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all 0.2s',
                    }}>
                    {type === 'cnpj' ? 'CNPJ (Empresa)' : 'CPF (Pessoa Física)'}
                  </button>
                ))}
              </div>

              <FieldRow label={form.documentType === 'cnpj' ? 'CNPJ' : 'CPF'}>
                <div style={{ position: 'relative' }}>
                  <StyledInput
                    value={form.document}
                    onChange={e => handleDocument(e.target.value)}
                    placeholder={form.documentType === 'cnpj' ? '00.000.000/0001-00' : '000.000.000-00'}
                    paddingRight={cnpjLoading ? 40 : undefined}
                  />
                  {cnpjLoading && <Loader2 style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: G.textMuted, animation: 'spin 1s linear infinite' }} />}
                </div>
              </FieldRow>

              <FieldRow label="Nome da barbearia">
                <StyledInput value={form.barbershopName} onChange={e => set('barbershopName', e.target.value)} placeholder="Ex: Vintage Barber" />
              </FieldRow>

              <FieldRow label="Telefone">
                <StyledInput value={form.barbershopPhone} onChange={e => set('barbershopPhone', maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </FieldRow>

              <FieldRow label="E-mail da barbearia">
                <StyledInput type="email" value={form.barbershopEmail} onChange={e => set('barbershopEmail', e.target.value)} placeholder="contato@barbearia.com" />
              </FieldRow>

              <FieldRow label="CEP">
                <div style={{ position: 'relative' }}>
                  <StyledInput value={form.cep} onChange={e => handleCEP(e.target.value)} placeholder="00000-000" paddingRight={cepLoading ? 40 : undefined} />
                  {cepLoading && <Loader2 style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: G.textMuted, animation: 'spin 1s linear infinite' }} />}
                </div>
              </FieldRow>

              <FieldRow label="Endereço">
                <StyledInput value={form.address} onChange={e => !cepLocked && set('address', e.target.value)} disabled={cepLocked} placeholder="Rua, número, bairro" />
              </FieldRow>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <FieldRow label="Cidade">
                  <StyledInput value={form.city} onChange={e => !cepLocked && set('city', e.target.value)} disabled={cepLocked} placeholder="São Paulo" />
                </FieldRow>
                <FieldRow label="UF">
                  <StyledInput value={form.state} onChange={e => !cepLocked && set('state', e.target.value.toUpperCase().slice(0, 2))} disabled={cepLocked} placeholder="SP" />
                </FieldRow>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, margin: 0 }}>{error}</p>
              )}

              <button type="button" onClick={goNext} style={primaryBtn}>
                Próximo
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FieldRow label="Seu nome">
                <StyledInput value={form.name} onChange={e => set('name', e.target.value)} placeholder="João Silva" />
              </FieldRow>

              <FieldRow label="Seu e-mail">
                <StyledInput type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" />
              </FieldRow>

              <FieldRow label="Telefone (opcional)">
                <StyledInput value={form.phone} onChange={e => set('phone', maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
              </FieldRow>

              <FieldRow label="Senha">
                <div style={{ position: 'relative' }}>
                  <StyledInput type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" paddingRight={42} />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: G.textDim, display: 'flex', padding: 0 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
              </FieldRow>

              <FieldRow label="Confirmar senha">
                <StyledInput type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••" />
              </FieldRow>

              <p style={{ fontSize: 11, color: G.textDim, textAlign: 'center', lineHeight: 1.5, margin: '4px 0' }}>
                Ao continuar, você concorda com os{' '}
                <span style={{ color: G.textMuted, textDecoration: 'underline', cursor: 'pointer' }}>Termos</span>
                {' '}e a{' '}
                <span style={{ color: G.textMuted, textDecoration: 'underline', cursor: 'pointer' }}>Política de Privacidade</span>.
              </p>

              {error && (
                <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, margin: 0 }}>{error}</p>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ ...ghostBtn, flex: '0 0 auto', padding: '13px 18px' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Voltar
                </button>
                <button type="submit" disabled={submitting} style={{ ...primaryBtn, flex: 1, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Criando conta...' : 'Criar conta grátis'}
                  {!submitting && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div style={{ fontSize: 11, color: G.textDim, textAlign: 'center', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 32 }}>
          Barberstack · Multi-tenant SaaS
        </div>
      </div>
    </div>
  );
}
