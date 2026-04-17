'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Scissors, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

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
  transition: 'border-color 0.2s',
};

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: G.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 36 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px ${G.goldGlow}` }}>
            <Scissors style={{ width: 18, height: 18, color: '#0D0D0B' }} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em', color: G.white }}>
            <span style={{ color: G.gold }}>Barber</span>stack
          </span>
        </div>

        {/* Card */}
        <div style={{ background: G.card, border: `1px solid ${G.goldBorder}`, borderRadius: 18, padding: '36px 32px', boxShadow: `0 24px 60px rgba(0,0,0,0.6), inset 0 1px 0 ${G.goldBorderBright}` }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: G.white, marginBottom: 6 }}>Bem-vindo de volta</h1>
          <p style={{ fontSize: 13, color: G.muted, marginBottom: 28 }}>Entre com sua conta para continuar</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = G.goldBorderBright)}
                onBlur={e => (e.target.style.borderColor = G.goldBorder)}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: G.muted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Senha</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ ...inputStyle, paddingRight: 42 }}
                  onFocus={e => (e.target.style.borderColor = G.goldBorderBright)}
                  onBlur={e => (e.target.style.borderColor = G.goldBorder)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: G.muted, display: 'flex' }}
                >
                  {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8 }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4, padding: '12px', borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: `linear-gradient(135deg, ${G.gold}, ${G.goldBright})`,
                color: '#0D0D0B', fontWeight: 700, fontSize: 14,
                boxShadow: `0 8px 24px ${G.goldGlow}`,
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        {/* Footer links */}
        <div style={{ textAlign: 'center', marginTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, color: G.muted }}>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: G.gold, textDecoration: 'none', fontWeight: 600 }}>
              Cadastrar barbearia
            </Link>
          </p>
          <Link href="/" style={{ fontSize: 12, color: G.muted, textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = G.white)}
            onMouseLeave={e => (e.currentTarget.style.color = G.muted)}
          >
            ← Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}
