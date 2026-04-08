'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { portalApi } from '@/lib/public.api';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

interface Props {
  mode: 'login' | 'register';
  shopId: string;
  onAuth: (token: string, user: any) => void;
  onClose: () => void;
  onSwitchMode: (m: 'login' | 'register') => void;
}

export function PortalLoginModal({ mode, shopId, onAuth, onClose, onSwitchMode }: Props) {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      if (mode === 'login') {
        const { data } = await portalApi.login(form.email, form.password);
        onAuth(data.token, data.user);
      } else {
        if (!form.name) { setError('Nome obrigatório'); setSubmitting(false); return; }
        const { data } = await portalApi.register({
          name: form.name,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          barbershopId: shopId,
        });
        onAuth(data.token, data.user);
      }
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao entrar. Verifique seus dados.');
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Nome completo</label>
                  <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Seu nome" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Telefone <span className="text-muted-foreground font-normal">(opcional)</span></label>
                  <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">E-mail</label>
              <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="seu@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Senha</label>
              <input className={inputCls} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="••••••••" />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <button type="submit" disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'login' ? 'Entrar' : 'Criar conta'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {mode === 'login' ? (
                <>Não tem conta?{' '}
                  <button type="button" onClick={() => onSwitchMode('register')} className="text-primary hover:underline">Cadastre-se</button>
                </>
              ) : (
                <>Já tem conta?{' '}
                  <button type="button" onClick={() => onSwitchMode('login')} className="text-primary hover:underline">Entrar</button>
                </>
              )}
            </p>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
