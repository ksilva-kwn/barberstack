'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors, ArrowRight, Loader2, TrendingUp } from 'lucide-react';
import { barbershopApi } from '@/lib/barbershop.api';
import { useAuth } from '@/hooks/use-auth';

const G = {
  bg:               '#0D0D0B',
  card:             '#131210',
  gold:             '#C4A47C',
  goldBright:       '#D8BC96',
  goldBorder:       'rgba(196,164,124,0.22)',
  goldBorderBright: 'rgba(196,164,124,0.45)',
  goldGlow:         'rgba(196,164,124,0.18)',
  white:            '#F3F0EA',
  muted:            '#7A746C',
  faint:            '#2A2620',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  background: G.bg, border: `1px solid ${G.goldBorder}`,
  color: G.white, fontSize: 14, outline: 'none', boxSizing: 'border-box',
};

function Input({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

function maskCurrency(v: string) {
  const digits = v.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const COMPANY_TYPES = [
  { value: 'MEI',        label: 'MEI — Microempreendedor Individual' },
  { value: 'LIMITED',    label: 'LTDA / EPP / Microempresa' },
  { value: 'INDIVIDUAL', label: 'Empresário Individual' },
  { value: 'ASSOCIATION', label: 'Associação' },
];

export default function FinanceiroPage() {
  const router = useRouter();
  const { user } = useAuth();
  const barbershopId = user?.barbershopId ?? '';

  const [income, setIncome]           = useState('');
  const [companyType, setCompanyType] = useState('MEI');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');

  const incomeNumeric = parseFloat(income.replace(/\./g, '').replace(',', '.')) || 0;

  const handleIncome = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIncome(maskCurrency(e.target.value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (incomeNumeric <= 0) { setError('Informe o faturamento mensal estimado'); return; }
    if (!barbershopId)       { setError('Sessão expirada, faça login novamente'); return; }

    setError(''); setSubmitting(true);
    try {
      await barbershopApi.updateFinancial(barbershopId, { incomeValue: incomeNumeric, companyType });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao salvar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  const font = "'Inter', 'Helvetica Neue', Arial, sans-serif";

  return (
    <div style={{ minHeight: '100vh', backgroundColor: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: font }}>
      <div style={{ width: '100%', maxWidth: 480 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 28 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '8px 16px', display: 'inline-flex' }}>
            <img src="/logo.png" alt="BarberStack" style={{ height: 44, width: 'auto' }} />
          </div>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: G.gold }} />
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: G.gold }} />
          <div style={{ flex: 1, height: 3, borderRadius: 99, background: G.faint }} />
        </div>
        <p style={{ fontSize: 11, color: G.muted, marginBottom: 20, textAlign: 'center', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          Passo 2 de 2 — Dados financeiros
        </p>

        {/* Card */}
        <div style={{ background: G.card, border: `1px solid ${G.goldBorder}`, borderRadius: 18, padding: '32px 28px', boxShadow: `0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 ${G.goldBorderBright}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${G.gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp style={{ width: 18, height: 18, color: G.gold }} />
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: G.white }}>Dados financeiros</h1>
          </div>
          <p style={{ fontSize: 13, color: G.muted, marginBottom: 24 }}>
            Estas informações são usadas para configurar sua conta de cobranças quando você ativar o módulo de assinaturas.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Input label="Tipo de empresa">
              <select
                value={companyType}
                onChange={e => setCompanyType(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
                onFocus={e => (e.target.style.borderColor = G.goldBorderBright)}
                onBlur={e => (e.target.style.borderColor = G.goldBorder)}
              >
                {COMPANY_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: G.card }}>{t.label}</option>
                ))}
              </select>
            </Input>

            <Input label="Faturamento mensal estimado (R$)">
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: G.muted, fontSize: 14, fontWeight: 500, pointerEvents: 'none' }}>R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={income}
                  onChange={handleIncome}
                  placeholder="0,00"
                  style={{ ...inputStyle, paddingLeft: 36 }}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)}
                  onBlur={e => (e.target.style.borderColor = G.goldBorder)}
                />
              </div>
              <p style={{ fontSize: 11, color: G.muted, marginTop: 6 }}>
                Estimativa do faturamento bruto mensal da barbearia. Exigido pelo provedor de pagamentos.
              </p>
            </Input>

            {error && (
              <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{ marginTop: 4, padding: '13px', borderRadius: 10, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`, color: '#0D0D0B', fontWeight: 700, fontSize: 14, opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 8px 24px ${G.goldGlow}` }}
            >
              {submitting ? (
                <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Salvando...</>
              ) : (
                <>Entrar no app <ArrowRight style={{ width: 16, height: 16 }} /></>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: G.muted, marginTop: 20 }}>
          Você pode atualizar essas informações depois em Configurações.
        </p>
      </div>
    </div>
  );
}
