'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Scissors, ArrowLeft, Loader2 } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import { portalApi } from '@/lib/public.api';

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

export default function PortalLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<'login' | 'register'>(
    searchParams.get('mode') === 'register' ? 'register' : 'login'
  );
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaVerifying, setCaptchaVerifying] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

  // Redirect if already logged in
  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (raw) router.replace(`/${slug}/painel`);
  }, [slug, router]);

  const { data: shop } = useQuery({
    queryKey: ['public-shop', slug],
    queryFn: () => portalApi.shop(slug).then(r => r.data),
  });

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const { data } = await portalApi.login(form.email, form.password, captchaToken ?? undefined);
        sessionStorage.setItem(`portal-auth-${slug}`, JSON.stringify({ token: data.token, user: data.user }));
        router.push(`/${slug}/painel`);
      } else {
        if (!form.name) { setError('Nome obrigatório'); setSubmitting(false); return; }
        if (!shop) { setError('Erro ao carregar dados da barbearia'); setSubmitting(false); return; }
        const { data } = await portalApi.register({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          barbershopId: shop.id,
          captchaToken: captchaToken ?? undefined,
        });
        sessionStorage.setItem(`portal-auth-${slug}`, JSON.stringify({ token: data.token, user: data.user }));
        router.push(`/${slug}/painel`);
      }
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao entrar. Verifique seus dados.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push(`/${slug}`)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          {shop?.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} className="w-7 h-7 rounded-lg object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
          )}
          <span className="font-semibold text-foreground text-sm truncate">{shop?.name ?? '...'}</span>
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </h1>
            <p className="text-muted-foreground text-sm mt-1.5">
              {mode === 'login'
                ? 'Entre para agendar seu horário'
                : 'Crie sua conta para agendar'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Nome completo</label>
                  <input
                    className={inputCls}
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Seu nome"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Telefone <span className="text-muted-foreground font-normal">(opcional)</span>
                  </label>
                  <input
                    className={inputCls}
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">E-mail</label>
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="seu@email.com"
                autoFocus={mode === 'login'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Senha</label>
              <input
                className={inputCls}
                type="password"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
            )}

            {siteKey && (
              <>
                <Turnstile
                  ref={turnstileRef}
                  siteKey={siteKey}
                  onSuccess={token => { setCaptchaToken(token); setCaptchaVerifying(false); }}
                  onExpire={() => { setCaptchaToken(null); setCaptchaVerifying(false); }}
                  onError={() => { setCaptchaToken(null); setCaptchaVerifying(false); }}
                  options={{ theme: 'auto', execution: 'execute', size: 'invisible' }}
                />
                <button
                  type="button"
                  onClick={() => { if (!captchaToken) { setCaptchaVerifying(true); turnstileRef.current?.execute(); } }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${captchaToken ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-input bg-background hover:border-primary/40'}`}
                >
                  <span className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${captchaToken ? 'bg-emerald-500 border-emerald-500' : 'border-input'}`}>
                    {captchaVerifying && !captchaToken && (
                      <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                    )}
                    {captchaToken && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                    )}
                  </span>
                  <span className={`text-sm flex-1 text-left ${captchaToken ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                    {captchaToken ? 'Verificado' : captchaVerifying ? 'Verificando...' : 'Não sou um robô'}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50 text-right leading-tight">
                    Cloudflare<br/>Turnstile
                  </span>
                </button>
              </>
            )}

            <button
              type="submit"
              disabled={submitting || (!!siteKey && !captchaToken)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'login' ? (
              <>Não tem conta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('register'); setError(''); setCaptchaToken(null); setCaptchaVerifying(false); }}
                  className="text-primary hover:underline font-medium"
                >
                  Cadastre-se
                </button>
              </>
            ) : (
              <>Já tem conta?{' '}
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setCaptchaToken(null); setCaptchaVerifying(false); }}
                  className="text-primary hover:underline font-medium"
                >
                  Entrar
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
