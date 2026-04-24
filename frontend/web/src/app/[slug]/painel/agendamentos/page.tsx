'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Clock, Scissors, ArrowRight, Loader2 } from 'lucide-react';
import { portalApi, ClientAppointment } from '@/lib/public.api';
import Link from 'next/link';

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED: 'text-amber-400 bg-amber-400/10',
  CONFIRMED: 'text-emerald-400 bg-emerald-400/10',
  COMPLETED: 'text-muted-foreground bg-muted',
  CANCELED:  'text-destructive bg-destructive/10',
  NO_SHOW:   'text-destructive bg-destructive/10',
};
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED: 'Agendado', CONFIRMED: 'Confirmado',
  COMPLETED: 'Concluído', CANCELED: 'Cancelado', NO_SHOW: 'Faltou',
};

function AppointmentCard({ apt }: { apt: ClientAppointment }) {
  const date = new Date(apt.scheduledAt);
  const services = apt.services.map(s => s.service.name).join(', ');
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-sm">
        {apt.professional.user.avatarUrl
          ? <img src={apt.professional.user.avatarUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
          : apt.professional.user.name.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{apt.professional.user.name}</p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">{services || '—'}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />{format(date, "d 'de' MMM yyyy", { locale: ptBR })}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />{format(date, 'HH:mm')}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Scissors className="w-3 h-3" />{apt.durationMins}min
          </span>
        </div>
      </div>
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[apt.status] ?? 'bg-muted text-muted-foreground'}`}>
        {STATUS_LABEL[apt.status] ?? apt.status}
      </span>
    </div>
  );
}

export default function AgendamentosPage() {
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

  if (!auth) return null;

  const upcoming = data?.upcoming ?? [];
  const past     = data?.past ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agendamentos</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Seus próximos e histórico de cortes</p>
        </div>
        <Link
          href={`/${slug}/agendar`}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          <Calendar className="w-4 h-4" /> Agendar
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {/* Próximos */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Próximos</h2>
            {upcoming.length === 0 ? (
              <div className="p-8 rounded-2xl border border-border bg-card text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum agendamento futuro</p>
                <Link href={`/${slug}/agendar`} className="inline-flex items-center gap-1.5 mt-4 text-sm font-medium text-primary">
                  Agendar agora <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
              </div>
            )}
          </section>

          {/* Histórico */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Histórico</h2>
            {past.length === 0 ? (
              <div className="p-6 rounded-2xl border border-border bg-card text-center">
                <p className="text-sm text-muted-foreground">Nenhum histórico encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {past.map(apt => <AppointmentCard key={apt.id} apt={apt} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
