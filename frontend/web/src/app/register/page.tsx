'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowRight, ArrowLeft, Loader2, Eye, EyeOff } from 'lucide-react';
import { authApi, RegisterBarbershopPayload } from '@/lib/auth.api';
import { useAuthStore } from '@/store/auth.store';

const G = {
  bg:         '#0D0D0B',
  card:       '#131210',
  gold:       '#C4A47C',
  goldBright: '#D8BC96',
  goldBorder: 'rgba(196,164,124,0.22)',
  goldBorderBright: 'rgba(196,164,124,0.45)',
  goldGlow:   'rgba(196,164,124,0.18)',
  white:      '#F3F0EA',
  muted:      '#7A746C',
  faint:      '#2A2620',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  background: G.bg,
  border: `1px solid ${G.goldBorder}`,
  color: G.white,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

function Input({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
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
    if (!isCnpj) { setCnpjLocked(false); return; } // CPF: sem auto-fill
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
        city:    data.localidade ?? '',
        state:   data.uf ?? '',
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

  const font = "'Inter', 'Helvetica Neue', Arial, sans-serif";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: font }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '8px 16px', display: 'inline-flex' }}>
            <img src="/logo.png" alt="BarberStack" style={{ height: 44, width: 'auto' }} />
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: step >= 1 ? G.gold : G.faint }} />
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: step >= 2 ? G.gold : G.faint }} />
        </div>
        <p style={{ fontSize: 11, color: G.muted, marginBottom: 20, textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {step === 1 ? 'Passo 1 de 2 — Dados da barbearia' : 'Passo 2 de 2 — Dados do responsável'}
        </p>

        {/* Card */}
        <div style={{ background: G.card, border: `1px solid ${G.goldBorder}`, borderRadius: 18, padding: '32px 28px', boxShadow: `0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 ${G.goldBorderBright}` }}>

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: G.white, marginBottom: 4 }}>Sua barbearia</h1>

              {/* Seletor CPF / CNPJ */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {(['cnpj', 'cpf'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => { setForm(f => ({ ...f, documentType: type, document: '' })); setCnpjLocked(false); }}
                    style={{
                      padding: '10px', borderRadius: 10, border: `1px solid ${form.documentType === type ? G.gold : G.goldBorder}`,
                      background: form.documentType === type ? `rgba(196,164,124,0.12)` : 'transparent',
                      color: form.documentType === type ? G.gold : G.muted,
                      fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                  >
                    {type === 'cnpj' ? 'Pessoa Jurídica (CNPJ)' : 'Pessoa Física (CPF)'}
                  </button>
                ))}
              </div>

              <Input label={form.documentType === 'cnpj' ? 'CNPJ' : 'CPF'}>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={form.document}
                    onChange={e => handleDocument(e.target.value)}
                    placeholder={form.documentType === 'cnpj' ? '00.000.000/0001-00' : '000.000.000-00'}
                    style={{ ...inputStyle, paddingRight: cnpjLoading ? 40 : 14 }}
                    onFocus={e => (e.target.style.borderColor = G.goldBorderBright)}
                    onBlur={e => (e.target.style.borderColor = G.goldBorder)}
                  />
                  {cnpjLoading && <Loader2 style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: G.muted, animation: 'spin 1s linear infinite' }} />}
                </div>
              </Input>

              <Input label="Nome da barbearia">
                <input type="text" value={form.barbershopName} onChange={e => set('barbershopName', e.target.value)} placeholder="Ex: Barbearia do João" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              <Input label="Telefone">
                <input type="text" value={form.barbershopPhone} onChange={e => set('barbershopPhone', maskPhone(e.target.value))} placeholder="(11) 99999-9999"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              <Input label="E-mail da barbearia">
                <input type="email" value={form.barbershopEmail} onChange={e => set('barbershopEmail', e.target.value)} placeholder="contato@barbearia.com"
                  style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              <Input label="CEP">
                <div style={{ position: 'relative' }}>
                  <input type="text" value={form.cep} onChange={e => handleCEP(e.target.value)} placeholder="00000-000" style={{ ...inputStyle, paddingRight: cepLoading ? 40 : 14 }}
                    onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
                  {cepLoading && <Loader2 style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: G.muted, animation: 'spin 1s linear infinite' }} />}
                </div>
              </Input>

              <Input label="Endereço">
                <input type="text" value={form.address} readOnly={cepLocked} onChange={e => !cepLocked && set('address', e.target.value)} placeholder="Rua, número, bairro"
                  style={{ ...inputStyle, ...(cepLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                  onFocus={e => !cepLocked && (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12 }}>
                <Input label="Cidade">
                  <input type="text" value={form.city} readOnly={cepLocked} onChange={e => !cepLocked && set('city', e.target.value)} placeholder="São Paulo"
                    style={{ ...inputStyle, ...(cepLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                    onFocus={e => !cepLocked && (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
                </Input>
                <Input label="UF">
                  <input type="text" value={form.state} readOnly={cepLocked} onChange={e => !cepLocked && set('state', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP"
                    style={{ ...inputStyle, ...(cepLocked ? { opacity: 0.6, cursor: 'not-allowed' } : {}) }}
                    onFocus={e => !cepLocked && (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
                </Input>
              </div>

              {error && <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>{error}</p>}

              <button type="button" onClick={goNext} style={{ marginTop: 4, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`, color: '#0D0D0B', fontWeight: 700, fontSize: 14, boxShadow: `0 8px 24px ${G.goldGlow}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                Próximo <ArrowRight style={{ width: 16, height: 16 }} />
              </button>
            </div>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: G.white, marginBottom: 4 }}>Responsável pela conta</h1>

              <Input label="Seu nome">
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="João Silva" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              <Input label="Seu e-mail">
                <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              <Input label="Telefone (opcional)">
                <input type="text" value={form.phone} onChange={e => set('phone', maskPhone(e.target.value))} placeholder="(11) 99999-9999" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              <Input label="Senha">
                <div style={{ position: 'relative' }}>
                  <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" style={{ ...inputStyle, paddingRight: 42 }}
                    onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
                  <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: G.muted, display: 'flex' }}>
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </Input>

              <Input label="Confirmar senha">
                <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} placeholder="••••••••" style={inputStyle}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)} onBlur={e => (e.target.style.borderColor = G.goldBorder)} />
              </Input>

              {error && <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>{error}</p>}

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => { setStep(1); setError(''); }} style={{ flex: 1, padding: '12px', borderRadius: 10, cursor: 'pointer', background: 'transparent', border: `1px solid ${G.goldBorder}`, color: G.muted, fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ArrowLeft style={{ width: 16, height: 16 }} /> Voltar
                </button>
                <button type="submit" disabled={submitting} style={{ flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`, color: '#0D0D0B', fontWeight: 700, fontSize: 14, opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Criando...' : 'Criar conta'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: G.muted, marginTop: 24 }}>
          Já tem uma conta?{' '}
          <Link href="/login" style={{ color: G.gold, textDecoration: 'none', fontWeight: 600 }}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
