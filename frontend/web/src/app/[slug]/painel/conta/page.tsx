'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { User, Camera, Mail, Phone, LogOut } from 'lucide-react';

export default function ContaPage() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (!raw) { router.replace(`/${slug}/entrar`); return; }
    setAuth(JSON.parse(raw));
  }, [slug]);

  const handleLogout = () => {
    sessionStorage.removeItem(`portal-auth-${slug}`);
    router.push(`/${slug}`);
  };

  if (!auth) return null;

  const { user } = auth;
  const initials = user.name?.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() ?? '?';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Minha conta</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Suas informações pessoais</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            {user.avatarUrl
              ? <img src={user.avatarUrl} className="w-20 h-20 rounded-full object-cover" alt="" />
              : initials}
          </div>
          <button
            disabled
            title="Em breve"
            className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center opacity-40 cursor-not-allowed"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="text-center">
          <p className="font-bold text-lg">{user.name}</p>
          <p className="text-xs text-muted-foreground">Foto de perfil em breve</p>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Nome</p>
            <p className="text-sm font-medium text-foreground">{user.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">E-mail</p>
            <p className="text-sm font-medium text-foreground">{user.email}</p>
          </div>
        </div>

        {user.phone && (
          <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm font-medium text-foreground">{user.phone}</p>
            </div>
          </div>
        )}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Sair da conta
      </button>
    </div>
  );
}
