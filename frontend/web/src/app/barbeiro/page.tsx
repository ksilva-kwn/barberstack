'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarOff, LogOut, Scissors, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { appointmentApi, AppointmentStatus } from '@/lib/appointment.api';
import { ScheduleGrid } from '@/components/agenda/schedule-grid';

export default function BarberPage() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Busca o professional associado ao user
  const { data: myProfessional } = useQuery({
    queryKey: ['my-professional', user?.id],
    queryFn: () => api.get('/api/professionals').then(r =>
      r.data.find((p: any) => p.userId === user?.id)
    ),
    enabled: !!user,
  });

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['barber-appointments', dateStr, myProfessional?.id],
    queryFn: () => appointmentApi.list({ date: dateStr, professionalId: myProfessional?.id }).then(r => r.data),
    enabled: !!myProfessional,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barber-appointments', dateStr, myProfessional?.id] }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      appointmentApi.reschedule(id, scheduledAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barber-appointments', dateStr, myProfessional?.id] }),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ id, durationMins }: { id: string; durationMins: number }) =>
      appointmentApi.resizeDuration(id, durationMins),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barber-appointments', dateStr, myProfessional?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['barber-appointments', dateStr, myProfessional?.id] }),
  });

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Scissors className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground text-sm">{user?.name}</p>
            <p className="text-xs text-muted-foreground">Barbeiro</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/barbeiro/folgas')}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
          >
            <CalendarOff className="w-4 h-4" />
            Folgas
          </button>
          {/* ADMIN que também é barbeiro pode voltar ao painel admin */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors text-foreground"
            >
              <LayoutDashboard className="w-4 h-4" />
              Painel Admin
            </button>
          )}
          <button
            onClick={() => { clearAuth(); router.push('/login'); }}
            className="flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent transition-colors text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </header>

      {/* Date nav */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-bold text-foreground">Minha Agenda</h1>
          <p className="text-muted-foreground text-sm capitalize">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <button onClick={() => setSelectedDate(d => subDays(d, 1))} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            className={`px-3 py-1 text-sm font-medium rounded transition-colors ${isToday ? 'text-primary' : 'text-foreground hover:bg-accent'}`}
          >
            Hoje
          </button>
          <button onClick={() => setSelectedDate(d => addDays(d, 1))} className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-hidden px-6 py-4 flex flex-col">
        {myProfessional ? (
          <ScheduleGrid
            professionals={[myProfessional]}
            appointments={appointments}
            onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            onReschedule={(id, scheduledAt) => rescheduleMutation.mutate({ id, scheduledAt })}
            onResize={(id, durationMins) => resizeMutation.mutate({ id, durationMins })}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
            Perfil de barbeiro não encontrado. Peça ao administrador para te cadastrar.
          </div>
        )}
      </div>
    </div>
  );
}
