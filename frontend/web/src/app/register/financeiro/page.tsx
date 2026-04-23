'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { barbershopApi } from '@/lib/barbershop.api';
import { useAuth } from '@/hooks/use-auth';

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

function maskCurrency(v: string) {
  const digits = v.replace(/\D/g, '');
  if (!digits) return '';
  const num = parseInt(digits, 10) / 100;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const COMPANY_TYPES = [
  { value: 'MEI',         label: 'MEI — Microempreendedor Individual' },
  { value: 'LIMITED',     label: 'LTDA / EPP / Microempresa' },
  { value: 'INDIVIDUAL',  label: 'Empresário Individual' },
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
    } finally { setSubmitting(false); }
  };

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: G.bg, border: `1px solid ${G.borderStrong}`,
    color: G.text, fontSize: 14, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <div style={{
      minHeight: '100vh', background: G.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: G.text,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Background radial */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse at 50% 0%, ${A}18 0%, transparent 65%)`,
        zIndex: 0,
      }} />

      {/* Grid lines */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', opacity: 0.35, zIndex: 0,
        backgroundImage: `repeating-linear-gradient(0deg, transparent 0 59px, ${G.border} 59px 60px),
                          repeating-linear-gradient(90deg, transparent 0 79px, ${G.border} 79px 80px)`,
      }} />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 480 }}>
        {/* Logo */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 40, width: '100%', justifyContent: 'center' }}>
          <img src="/bzinho.png" alt="" style={{ width: 22, height: 22 * (183 / 148), objectFit: 'contain' }} />
          <span style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontWeight: 600, fontSize: 17, letterSpacing: '-0.02em', color: G.text }}>
            barberstack
          </span>
        </div>

        {/* Progress: 3 steps, last one highlighted */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
          <div style={{ flex: 1, height: 2, borderRadius: 99, background: A }} />
          <div style={{ flex: 1, height: 2, borderRadius: 99, background: A }} />
          <div style={{ flex: 1, height: 2, borderRadius: 99, background: A + '50' }} />
        </div>
        <p style={{ fontSize: 11, color: G.textDim, marginBottom: 32, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Último passo — Dados financeiros
        </p>

        {/* Card */}
        <div style={{
          background: G.bgCard, border: `1px solid ${G.borderStrong}`,
          borderRadius: 20, padding: '36px 32px',
          boxShadow: `0 32px 64px rgba(0,0,0,0.6), 0 0 0 1px ${G.border} inset`,
        }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `${A}18`, border: `1px solid ${A}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>
              </svg>
            </div>
            <div>
              <h1 style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 24, fontWeight: 500, letterSpacing: '-0.03em', margin: 0 }}>
                Dados financeiros
              </h1>
              <p style={{ fontSize: 13, color: G.textMuted, margin: '4px 0 0' }}>
                Exigido pelo provedor de cobranças para ativar assinaturas.
              </p>
            </div>
          </div>

          {/* Info banner */}
          <div style={{
            marginTop: 24, marginBottom: 24,
            padding: '12px 16px', borderRadius: 10,
            background: `${A}0C`, border: `1px solid ${A}25`,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={A} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 1, flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
            </svg>
            <p style={{ fontSize: 12.5, color: G.textMuted, lineHeight: 1.55, margin: 0 }}>
              Estas informações configuram sua subconta Asaas para cobranças recorrentes e antecipações. Você pode atualizar depois em Configurações.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Company type */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11.5, color: G.textMuted, fontWeight: 500, letterSpacing: '-0.01em' }}>Tipo de empresa</span>
              <select
                value={companyType}
                onChange={e => setCompanyType(e.target.value)}
                style={{ ...inputBase, cursor: 'pointer' }}
                onFocus={e => (e.target.style.borderColor = A + '80')}
                onBlur={e => (e.target.style.borderColor = G.borderStrong)}
              >
                {COMPANY_TYPES.map(t => (
                  <option key={t.value} value={t.value} style={{ background: G.bgCard }}>{t.label}</option>
                ))}
              </select>
            </label>

            {/* Monthly income */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11.5, color: G.textMuted, fontWeight: 500, letterSpacing: '-0.01em' }}>Faturamento mensal estimado</span>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  color: G.textDim, fontSize: 14, fontWeight: 500, pointerEvents: 'none',
                  fontFamily: 'ui-monospace, monospace',
                }}>R$</span>
                <input
                  type="text" inputMode="numeric" value={income} onChange={handleIncome}
                  placeholder="0,00"
                  style={{ ...inputBase, paddingLeft: 40 }}
                  onFocus={e => (e.target.style.borderColor = A + '80')}
                  onBlur={e => (e.target.style.borderColor = G.borderStrong)}
                />
              </div>
              <span style={{ fontSize: 11.5, color: G.textDim, lineHeight: 1.4 }}>
                Faturamento bruto mensal aproximado da barbearia.
              </span>
            </label>

            {error && (
              <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, margin: 0 }}>
                {error}
              </p>
            )}

            <button
              type="submit" disabled={submitting}
              style={{
                marginTop: 8, padding: '14px 20px', borderRadius: 10, border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`,
                color: '#0B0A09', fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                boxShadow: `0 1px 0 rgba(255,255,255,0.2) inset, 0 10px 30px -10px ${A}66`,
                opacity: submitting ? 0.7 : 1, transition: 'opacity 0.2s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {submitting ? (
                <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Salvando...</>
              ) : (
                <>
                  Entrar no app
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: G.textDim, marginTop: 20, lineHeight: 1.5 }}>
          Você pode pular e configurar depois em{' '}
          <span
            onClick={() => router.push('/dashboard')}
            style={{ color: G.textMuted, textDecoration: 'underline', cursor: 'pointer' }}
          >
            Configurações → Financeiro
          </span>.
        </p>
      </div>
    </div>
  );
}
