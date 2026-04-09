'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowLeft, Plus, X, CalendarOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

interface DayOff {
  id: string;
  date: string;
  reason: string | null;
}

export default function FolgasPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [newDate, setNewDate] = useState('');
  const [newReason, setNewReason] = useState('');

  const { data: myProfessional } = useQuery({
    queryKey: ['my-professional', user?.id],
    queryFn: () => api.get('/api/professionals').then(r =>
      r.data.find((p: any) => p.userId === user?.id)
    ),
    enabled: !!user,
  });

  const { data: dayOffs = [], isLoading } = useQuery<DayOff[]>({
    queryKey: ['day-offs', myProfessional?.id],
    queryFn: () => api.get(`/api/professionals/${myProfessional.id}/day-offs`).then(r => r.data),
    enabled: !!myProfessional,
  });

  const addMutation = useMutation({
    mutationFn: () => api.post(`/api/professionals/${myProfessional.id}/day-offs`, {
      date: newDate,
      reason: newReason || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-offs', myProfessional?.id] });
      setNewDate('');
      setNewReason('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (dayOffId: string) =>
      api.delete(`/api/professionals/${myProfessional.id}/day-offs/${dayOffId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['day-offs', myProfessional?.id] }),
  });

  const today = format(new Date(), 'yyyy-MM-dd');

  // Separa futuras / passadas
  const upcoming = dayOffs.filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past     = dayOffs.filter(d => d.date < today).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-3 flex items-center gap-3">
        <button onClick={() => router.push('/barbeiro')} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <CalendarOff className="w-5 h-5 text-muted-foreground" />
        <h1 className="font-semibold text-foreground">Minhas Folgas</h1>
      </header>

      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Adicionar folga */}
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-medium text-foreground text-sm">Adicionar folga</h2>
          <div className="flex gap-2">
            <input
              type="date"
              value={newDate}
              min={today}
              onChange={e => setNewDate(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <input
              type="text"
              value={newReason}
              onChange={e => setNewReason(e.target.value)}
              placeholder="Motivo (opcional)"
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={() => newDate && addMutation.mutate()}
              disabled={!newDate || addMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors shrink-0"
            >
              {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Folgas futuras */}
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <>
            {upcoming.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Próximas folgas</h3>
                <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                  {upcoming.map(d => (
                    <div key={d.id} className="flex items-center justify-between px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-foreground capitalize">
                          {format(parseISO(d.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                        </p>
                        {d.reason && <p className="text-xs text-muted-foreground mt-0.5">{d.reason}</p>}
                      </div>
                      <button
                        onClick={() => removeMutation.mutate(d.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">
                <CalendarOff className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Nenhuma folga agendada.
              </div>
            )}

            {past.length > 0 && (
              <div>
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Histórico</h3>
                <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden opacity-50">
                  {past.slice(0, 5).map(d => (
                    <div key={d.id} className="flex items-center justify-between px-4 py-2.5">
                      <p className="text-sm text-foreground capitalize">
                        {format(parseISO(d.date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                      </p>
                      {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
