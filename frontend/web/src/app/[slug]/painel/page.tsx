'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format, isFuture, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Calendar, Scissors, Clock, ChevronRight, LogOut,
  Star, Loader2, User, ArrowRight, CheckCircle2, XCircle,
} from 'lucide-react';
import { portalApi, ClientAppointment } from '@/lib/public.api';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendado',
  CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído',
  CANCELED: 'Cancelado',
  NO_SHOW: 'Faltou',
};

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'text-amber-400 bg-amber-400/10',
  CONFIRMED: 'text-emerald-400 bg-emerald-400/10',
  COMPLETED: 'text-muted-foreground bg-muted',
  CANCELED: 'text-destructive bg-destructive/10',
  NO_SHOW: 'text-destructive bg-destructive/10',
};

function AppointmentCard({ apt, upcoming }: { apt: ClientAppointment; upcoming?: boolean }) {
  const date = new Date(apt.scheduledAt);
  const serviceNames = apt.services.map(s => s.service.name).join(', ');

  return (
    <div
      className="flex items-start gap-4 p-4 rounded-2xl border transition-colors"
      style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
    >
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
        style={{ backgroundColor: 'hsl(var(--primary) / 0.15)', color: 'hsl(var(--primary))' }}
      >
        {apt.professional.user.avatarUrl
          ? <img src={apt.professional.user.avatarUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
          : apt.professional.user.name.charAt(0).toUpperCase()
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{apt.professional.user.name}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{serviceNames || '—'}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {format(date, "d 'de' MMM", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {format(date, 'HH:mm')}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Scissors className="w-3 h-3" />
            {apt.durationMins} min
          </span>
        </div>
      </div>

      {/* Status */}
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[apt.status] ?? 'text-muted-foreground bg-muted'}`}>
        {STATUS_LABEL[apt.status] ?? apt.status}
      </span>
    </div>
  );
}

export default function PainelPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (!raw) {
      router.replace(`/${slug}`);
      return;
    }
    setAuth(JSON.parse(raw));
  }, [slug]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments', slug],
    queryFn: () => portalApi.myAppointments(auth!.token).then(r => r.data),
    enabled: !!auth?.token,
  });

  const handleLogout = () => {
    sessionStorage.removeItem(`portal-auth-${slug}`);
    router.push(`/${slug}`);
  };

  if (!auth) return null;

  const upcoming = data?.upcoming ?? [];
  const past = data?.past ?? [];
  const firstName = auth.user?.name?.split(' ')[0] ?? 'Cliente';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'hsl(var(--background))', color: 'hsl(var(--foreground))' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-10 border-b"
        style={{ backgroundColor: 'hsl(var(--background) / 0.97)', borderColor: 'hsl(var(--border))', backdropFilter: 'blur(12px)' }}
      >
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${slug}`} className="flex items-center gap-2 text-sm font-bold">
            <Scissors className="w-4 h-4" style={{ color: 'hsl(var(--primary))' }} />
            <span>Barberstack</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Sair
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Olá, {firstName}!</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Veja seus agendamentos e histórico</p>
          </div>
          <Link
            href={`/${slug}/agendar`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold shadow"
            style={{ backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          >
            <Calendar className="w-4 h-4" /> Agendar
          </Link>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs text-muted-foreground mb-1">Próximos</p>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{upcoming.length}</p>
            <p className="text-xs text-muted-foreground mt-1">agendamento{upcoming.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="p-4 rounded-2xl border" style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <p className="text-xs text-muted-foreground mb-1">Histórico</p>
            <p className="text-3xl font-bold" style={{ color: 'hsl(var(--primary))' }}>{past.length}</p>
            <p className="text-xs text-muted-foreground mt-1">corte{past.length !== 1 ? 's' : ''} realizados</p>
          </div>
        </div>

        {/* Assinaturas (placeholder) */}
        <div
          className="p-5 rounded-2xl border flex items-center justify-between"
          style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
        >
          <div>
            <p className="font-semibold text-sm">Assinatura</p>
            <p className="text-xs text-muted-foreground mt-0.5">Planos mensais em breve</p>
          </div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: 'hsl(var(--primary) / 0.12)', color: 'hsl(var(--primary))' }}>
            Em breve
          </span>
        </div>

        {/* Próximos agendamentos */}
        <section>
          <h2 className="text-base font-bold mb-3">Próximos agendamentos</h2>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : upcoming.length === 0 ? (
            <div
              className="p-8 rounded-2xl border text-center"
              style={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
            >
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum agendamento futuro</p>
              <Link
                href={`/${slug}/agendar`}
                className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium"
                style={{ color: 'hsl(var(--primary))' }}
              >
                Agendar agora <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map(apt => <AppointmentCard key={apt.id} apt={apt} upcoming />)}
            </div>
          )}
        </section>

        {/* Histórico */}
        {past.length > 0 && (
          <section>
            <h2 className="text-base font-bold mb-3">Histórico de cortes</h2>
            <div className="space-y-3">
              {past.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
