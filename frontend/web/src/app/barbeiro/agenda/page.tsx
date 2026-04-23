'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';
import { appointmentApi, AppointmentStatus, Appointment } from '@/lib/appointment.api';
import { BarbershopService } from '@/lib/barbershop.api';
import { ScheduleGrid, DayOffBlock, RecurringBlockDisplay } from '@/components/agenda/schedule-grid';
import { EditAppointmentModal } from '@/components/agenda/edit-appointment-modal';

export default function BarberAgendaPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingApt, setEditingApt] = useState<Appointment | null>(null);
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

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

  const { data: dayOffs = [] } = useQuery<DayOffBlock[]>({
    queryKey: ['barber-day-offs', myProfessional?.id, dateStr],
    queryFn: async () => {
      const r = await api.get(`/api/professionals/${myProfessional.id}/day-offs`);
      return (r.data as { id: string; date: string; startTime: string | null; endTime: string | null; reason: string | null }[])
        .filter(d => d.date === dateStr)
        .map(d => ({ professionalId: myProfessional.id, date: d.date, reason: d.reason, startTime: d.startTime, endTime: d.endTime }));
    },
    enabled: !!myProfessional,
  });

  const selectedDow = selectedDate.getDay();

  const { data: services = [] } = useQuery<BarbershopService[]>({
    queryKey: ['services'],
    queryFn: () => api.get('/api/services').then(r => r.data),
  });

  const { data: recurringBlocks = [] } = useQuery<RecurringBlockDisplay[]>({
    queryKey: ['barber-recurring-blocks', myProfessional?.id, selectedDow],
    queryFn: async () => {
      const r = await api.get(`/api/professionals/${myProfessional.id}/recurring-blocks`);
      return (r.data as { id: string; dayOfWeek: number | null; startTime: string; endTime: string; reason: string | null }[])
        .filter(b => b.dayOfWeek == null || b.dayOfWeek === selectedDow)
        .map(b => ({ professionalId: myProfessional.id, startTime: b.startTime, endTime: b.endTime, reason: b.reason }));
    },
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

  function gcd(a: number, b: number): number { return b === 0 ? a : gcd(b, a % b); }
  const durations = services.map(s => s.durationMins).filter(d => d > 0);
  const snapMins = Math.min(Math.max(durations.length > 0 ? durations.reduce(gcd) : 15, 5), 30);

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Minha Agenda</h1>
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

      {!myProfessional ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Perfil de barbeiro não encontrado. Peça ao administrador para te cadastrar.
        </div>
      ) : isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScheduleGrid
          professionals={[myProfessional]}
          appointments={appointments}
          dayOffs={dayOffs}
          recurringBlocks={recurringBlocks}
          snapMins={snapMins}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          onReschedule={(id, scheduledAt) => rescheduleMutation.mutate({ id, scheduledAt })}
          onResize={(id, durationMins) => resizeMutation.mutate({ id, durationMins })}
          onDelete={(id) => deleteMutation.mutate(id)}
          onEdit={(apt) => setEditingApt(apt)}
        />
      )}

      {editingApt && (
        <EditAppointmentModal
          appointment={editingApt}
          services={services}
          onClose={() => setEditingApt(null)}
          onSaved={() => {
            setEditingApt(null);
            queryClient.invalidateQueries({ queryKey: ['barber-appointments', dateStr, myProfessional?.id] });
          }}
        />
      )}
    </div>
  );
}
