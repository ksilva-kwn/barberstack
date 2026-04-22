'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, ArrowRight, CreditCard, Loader2 } from 'lucide-react';
import { portalApi, ClientAppointment } from '@/lib/public.api';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED:   'text-amber-400 bg-amber-400/10',
  CONFIRMED:   'text-emerald-400 bg-emerald-400/10',
  COMPLETED:   'text-muted-foreground bg-muted',
  CANCELED:    'text-destructive bg-destructive/10',
  NO_SHOW:     'text-destructive bg-destructive/10',
};
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendado', CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído', CANCELED: 'Cancelado', NO_SHOW: 'Faltou',
};

export default function PainelHome() {
  const { slug } = useParams<{ slug: string }>();
  const router   = useRouter();
  const [auth, setAuth] = useState<{ token: string; user: any } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (!raw) { router.replace(`/${slug}/entrar`); return; }
    setAuth(JSON.parse(raw));
  }, [slug]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-appointments', slug],
    queryFn: () => portalApi.myAppointments(auth!.token).then(r => r.data),
    enabled: !!auth?.token,
  });

  const { data: sub } = useQuery({
    queryKey: ['my-subscription', slug],
    queryFn: () => portalApi.mySubscription(auth!.token, slug).then(r => r.data),
    enabled: !!auth?.token,
  });

  if (!auth) return null;

  const upcoming = data?.upcoming ?? [];
  const past     = data?.past ?? [];
  const firstName = auth.user?.name?.split(' ')[0] ?? 'Cliente';

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Olá, {firstName}!</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Bem-vindo ao seu painel</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Próximos</p>
          <p className="text-3xl font-bold text-primary">{upcoming.length}</p>
          <p className="text-xs text-muted-foreground mt-1">agendamento{upcoming.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="p-4 rounded-2xl border border-border bg-card">
          <p className="text-xs text-muted-foreground mb-1">Histórico</p>
          <p className="text-3xl font-bold text-primary">{past.length}</p>
          <p className="text-xs text-muted-foreground mt-1">corte{past.length !== 1 ? 's' : ''} realizados</p>
        </div>
      </div>

      {/* Assinatura */}
      <Link href={`/${slug}/painel/assinatura`} className="block p-5 rounded-2xl border border-border bg-card hover:bg-accent/20 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Assinatura</p>
              {sub?.status === 'ACTIVE' ? (
                <p className="text-xs text-emerald-500 mt-0.5">{sub.clientPlan.name} · Ativo</p>
              ) : sub?.status === 'PENDING_PAYMENT' ? (
                <p className="text-xs text-blue-500 mt-0.5">{sub.clientPlan.name} · Aguardando pagamento</p>
              ) : sub?.status === 'CANCELING' ? (
                <p className="text-xs text-amber-500 mt-0.5">{sub.clientPlan.name} · Cancelando</p>
              ) : (
                <p className="text-xs text-muted-foreground mt-0.5">Nenhum plano ativo</p>
              )}
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Link>

      {/* Próximos agendamentos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">Próximos agendamentos</h2>
          <Link href={`/${slug}/painel/agendamentos`} className="text-xs text-primary hover:underline">Ver todos</Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : upcoming.length === 0 ? (
          <div className="p-8 rounded-2xl border border-border bg-card text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum agendamento futuro</p>
            <Link href={`/${slug}/agendar`} className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary">
              Agendar agora <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 3).map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function AppointmentCard({ apt }: { apt: ClientAppointment }) {
  const date = new Date(apt.scheduledAt);
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
        {apt.professional.user.avatarUrl
          ? <img src={apt.professional.user.avatarUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
          : apt.professional.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{apt.professional.user.name}</p>
        <p className="text-xs text-muted-foreground truncate">{apt.services.map(s => s.service.name).join(', ') || '—'}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />{format(date, "d 'de' MMM", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />{format(date, 'HH:mm')}
          </span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[apt.status] ?? 'bg-muted text-muted-foreground'}`}>
        {STATUS_LABEL[apt.status] ?? apt.status}
      </span>
    </div>
  );
}
