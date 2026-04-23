'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

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

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

const loginCss = `
  .login-grid { display: grid; grid-template-columns: clamp(340px,50%,600px) 1fr; }
  .login-left  { display: flex; }
  .login-right { padding: 44px 56px; display: flex; flex-direction: column; }
  @media (max-width: 768px) {
    .login-grid  { grid-template-columns: 1fr; }
    .login-left  { display: none; }
    .login-right { padding: 40px 24px; }
  }
`;

export default function LoginPage() {
  const { login, loading, error } = useAuth();
  const { token, user } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  useEffect(() => {
    if (token && user) {
      router.replace(user.role === 'BARBER' ? '/barbeiro/dashboard' : '/dashboard');
    }
  }, [token, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(email, password, rememberMe, captchaToken ?? undefined);
  };

  const inputBase: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 10,
    background: G.bg, border: `1px solid ${G.borderStrong}`,
    color: G.text, fontSize: 14, outline: 'none',
    fontFamily: 'inherit', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <>
    <style>{loginCss}</style>
    <div className="login-grid" style={{
      width: '100%', minHeight: '100vh',
      background: G.bg,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      color: G.text,
    }}>
      {/* ── Left: marketing panel ── */}
      <div className="login-left" style={{
        position: 'relative', padding: '44px 56px',
        flexDirection: 'column', justifyContent: 'space-between',
        overflow: 'hidden',
        background: `radial-gradient(ellipse at 30% 20%, ${A}22 0%, transparent 60%), linear-gradient(160deg, ${G.bgCard2} 0%, ${G.bg} 100%)`,
        borderRight: `1px solid ${G.border}`,
      }}>
        {/* horizontal grid lines */}
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

        {/* Headline block */}
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 10, letterSpacing: '0.2em', color: A, textTransform: 'uppercase', marginBottom: 18 }}>
            — Bem-vindo de volta
          </div>
          <h1 style={{
            fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 'clamp(36px, 4vw, 48px)',
            fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1.02, margin: 0,
          }}>
            A tesoura afia,<br />
            a <span style={{ fontStyle: 'italic', color: A }}>agenda</span> organiza.
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, color: G.textMuted, marginTop: 22, maxWidth: 420 }}>
            Acesse seu painel e continue exatamente de onde parou — comandas abertas, agenda de hoje, comissões a pagar.
          </p>
        </div>

        {/* Testimonial */}
        <div style={{
          position: 'relative',
          background: `${G.bgCard}cc`, backdropFilter: 'blur(20px)',
          border: `1px solid ${G.border}`, borderRadius: 16, padding: 22,
        }}>
          <p style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 15, fontStyle: 'italic', lineHeight: 1.5, color: G.text, margin: 0 }}>
            "Substituí 3 planilhas, 2 apps e um caderno. Faturo 28% a mais desde que migrei."
          </p>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${A} 0%, ${G.bgCard2} 100%)`, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Rafael Carvalho</div>
              <div style={{ fontSize: 11, color: G.textDim }}>Dono · Vintage Barber, SP</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="login-right">
        <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: 13, color: G.textMuted }}>
          Ainda não tem conta?{' '}
          <Link href="/register" style={{ color: A, marginLeft: 8, fontWeight: 500, textDecoration: 'none' }}>
            Começar grátis →
          </Link>
        </div>

        {/* Form centered */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: 420, margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 34, fontWeight: 500, letterSpacing: '-0.03em', margin: '0 0 6px' }}>
            Entrar no Barberstack
          </h2>
          <p style={{ fontSize: 13.5, color: G.textMuted, marginBottom: 32 }}>
            Use seu e-mail e senha cadastrados.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Email */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11.5, color: G.textMuted, fontWeight: 500, letterSpacing: '-0.01em' }}>E-mail</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: G.bg, border: `1px solid ${G.borderStrong}` }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.textDim} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>
                </svg>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="voce@barbearia.com" required
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: G.text, fontSize: 14, fontFamily: 'inherit' }}
                />
              </div>
            </label>

            {/* Password */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11.5, color: G.textMuted, fontWeight: 500, letterSpacing: '-0.01em' }}>Senha</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 10, background: G.bg, border: `1px solid ${G.borderStrong}` }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={G.textDim} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: G.text, fontSize: 14, fontFamily: 'inherit' }}
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: G.textDim, display: 'flex', padding: 0 }}>
                  <EyeIcon open={showPassword} />
                </button>
              </div>
            </label>

            {/* Remember + forgot */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12.5 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: G.textMuted, cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${rememberMe ? A : G.borderStrong}`,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  background: rememberMe ? A : 'transparent',
                  transition: 'background 0.15s, border-color 0.15s',
                }}>
                  {rememberMe && (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0B0A09" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5"/>
                    </svg>
                  )}
                </span>
                Lembrar por 30 dias
              </label>
              <a href="#" style={{ color: A, textDecoration: 'none', fontWeight: 500 }}>Esqueci a senha</a>
            </div>

            {error && (
              <p style={{ fontSize: 13, color: '#f87171', padding: '8px 12px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 8, margin: 0 }}>
                {error}
              </p>
            )}

            {/* Captcha */}
            {siteKey && (
              <>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={token => { setCaptchaToken(token); setCaptchaVerifying(false); }}
                  onExpire={() => { setCaptchaToken(null); setCaptchaVerifying(false); }}
                  onError={() => { setCaptchaToken(null); setCaptchaVerifying(false); }}
                  options={{ theme: 'dark', execution: 'execute', size: 'invisible' }}
                />
                <button
                  type="button"
                  onClick={() => { if (!captchaToken) { setCaptchaVerifying(true); turnstileRef.current?.execute(); } }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px', borderRadius: 10, border: `1px solid ${captchaToken ? '#22c55e55' : G.borderStrong}`,
                    background: captchaToken ? 'rgba(34,197,94,0.06)' : G.bg,
                    cursor: captchaToken ? 'default' : 'pointer',
                    transition: 'border-color 0.2s, background 0.2s', width: '100%',
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0, border: `1.5px solid ${captchaToken ? '#22c55e' : G.borderStrong}`,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: captchaToken ? '#22c55e' : 'transparent',
                    transition: 'background 0.2s, border-color 0.2s',
                  }}>
                    {captchaVerifying && !captchaToken && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={G.textDim} strokeWidth="2.5" strokeLinecap="round">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                    )}
                    {captchaToken && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </span>
                  <span style={{ fontSize: 13, color: captchaToken ? '#22c55e' : G.textMuted }}>
                    {captchaToken ? 'Verificado' : captchaVerifying ? 'Verificando...' : 'Não sou um robô'}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: G.textDim, textAlign: 'right', lineHeight: 1.3 }}>
                    Cloudflare<br/>Turnstile
                  </span>
                </button>
              </>
            )}

            {/* Submit */}
            <button
              type="submit" disabled={loading || (!!siteKey && !captchaToken)}
              style={{
                marginTop: 8, padding: '13px 20px', borderRadius: 10, border: 'none',
                cursor: (loading || (!!siteKey && !captchaToken)) ? 'not-allowed' : 'pointer',
                background: `linear-gradient(180deg, ${A} 0%, ${A}dd 100%)`,
                color: '#0B0A09', fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
                boxShadow: `0 1px 0 rgba(255,255,255,0.2) inset, 0 10px 30px -10px ${A}66`,
                opacity: (loading || (!!siteKey && !captchaToken)) ? 0.7 : 1, transition: 'opacity 0.2s, transform 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
              {!loading && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
              <div style={{ flex: 1, height: 1, background: G.border }} />
              <span style={{ fontSize: 10.5, color: G.textDim, fontFamily: 'ui-monospace, monospace', letterSpacing: '0.1em' }}>OU CONTINUE COM</span>
              <div style={{ flex: 1, height: 1, background: G.border }} />
            </div>

            {/* Social buttons */}
            <button type="button" style={{
              padding: '11px', borderRadius: 10, cursor: 'not-allowed',
              background: 'transparent', color: G.text, fontFamily: 'inherit',
              border: `1px solid ${G.borderStrong}`, fontWeight: 500, fontSize: 13,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: 0.6,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continuar com Google
            </button>
          </form>
        </div>

        <div style={{ fontSize: 11, color: G.textDim, textAlign: 'center', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Barberstack · Multi-tenant SaaS
        </div>
      </div>
    </div>
    </>
  );
}
