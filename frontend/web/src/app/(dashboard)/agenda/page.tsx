'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Loader2 } from 'lucide-react';
import { barbershopApi } from '@/lib/barbershop.api';
import { appointmentApi, AppointmentStatus } from '@/lib/appointment.api';
import { ScheduleGrid, DayOffBlock, RecurringBlockDisplay } from '@/components/agenda/schedule-grid';
import { api } from '@/lib/api';
import { NewAppointmentModal } from '@/components/agenda/new-appointment-modal';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const { data: professionals = [], isLoading: loadingProfs } = useQuery({
    queryKey: ['professionals'],
    queryFn: () => barbershopApi.professionals().then((r) => r.data),
  });

  const { data: appointments = [], isLoading: loadingApts } = useQuery({
    queryKey: ['appointments', dateStr],
    queryFn: () => appointmentApi.list({ date: dateStr }).then((r) => r.data),
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => barbershopApi.services().then((r) => r.data),
  });

  const professionalIds = professionals.map(p => p.id);
  const selectedDow = selectedDate.getDay();

  const { data: dayOffs = [] } = useQuery<DayOffBlock[]>({
    queryKey: ['agenda-day-offs', dateStr, professionalIds],
    queryFn: async () => {
      const results = await Promise.all(
        professionals.map(async (p) => {
          try {
            const r = await api.get(`/api/professionals/${p.id}/day-offs`);
            return (r.data as { id: string; date: string; startTime: string | null; endTime: string | null; reason: string | null }[])
              .filter(d => d.date === dateStr)
              .map(d => ({ professionalId: p.id, date: d.date, reason: d.reason, startTime: d.startTime, endTime: d.endTime }));
          } catch { return []; }
        })
      );
      return results.flat();
    },
    enabled: professionals.length > 0,
  });

  const { data: recurringBlocks = [] } = useQuery<RecurringBlockDisplay[]>({
    queryKey: ['agenda-recurring-blocks', professionalIds, selectedDow],
    queryFn: async () => {
      const results = await Promise.all(
        professionals.map(async (p) => {
          try {
            const r = await api.get(`/api/professionals/${p.id}/recurring-blocks`);
            return (r.data as { id: string; dayOfWeek: number | null; startTime: string; endTime: string; reason: string | null }[])
              .filter(b => b.dayOfWeek == null || b.dayOfWeek === selectedDow)
              .map(b => ({ professionalId: p.id, startTime: b.startTime, endTime: b.endTime, reason: b.reason }));
          } catch { return []; }
        })
      );
      return results.flat();
    },
    enabled: professionals.length > 0,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) =>
      appointmentApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', dateStr] }),
  });

  const rescheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }: { id: string; scheduledAt: string }) =>
      appointmentApi.reschedule(id, scheduledAt),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', dateStr] }),
  });

  const resizeMutation = useMutation({
    mutationFn: ({ id, durationMins }: { id: string; durationMins: number }) =>
      appointmentApi.resizeDuration(id, durationMins),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', dateStr] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['appointments', dateStr] }),
  });

  const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground text-sm capitalize">
            {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
            <button
              onClick={() => setSelectedDate((d) => subDays(d, 1))}
              className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(new Date())}
              className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                isToday ? 'text-primary' : 'text-foreground hover:bg-accent'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setSelectedDate((d) => addDays(d, 1))}
              className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* Grid */}
      {loadingProfs || loadingApts ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ScheduleGrid
          professionals={professionals}
          appointments={appointments}
          dayOffs={dayOffs}
          recurringBlocks={recurringBlocks}
          onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
          onReschedule={(id, scheduledAt) => rescheduleMutation.mutate({ id, scheduledAt })}
          onResize={(id, durationMins) => resizeMutation.mutate({ id, durationMins })}
          onDelete={(id) => deleteMutation.mutate(id)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <NewAppointmentModal
          professionals={professionals}
          services={services}
          defaultDate={selectedDate}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ['appointments', dateStr] });
          }}
        />
      )}
    </div>
  );
}
