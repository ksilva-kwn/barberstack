'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X, CalendarOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

interface DayOff {
  id: string;
  date: string;
  reason: string | null;
}

type SelectionMode = 'day' | 'range' | 'week' | 'month';

const inputCls = 'px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground';

export default function FolgasPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [mode, setMode] = useState<SelectionMode>('day');
  const [singleDate, setSingleDate]     = useState('');
  const [rangeFrom,  setRangeFrom]      = useState('');
  const [rangeTo,    setRangeTo]        = useState('');
  const [weekDate,   setWeekDate]       = useState('');
  const [monthDate,  setMonthDate]      = useState('');
  const [reason,     setReason]         = useState('');

  const today = format(new Date(), 'yyyy-MM-dd');

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

  // Build list of dates to add based on mode
  const getDatesToAdd = (): string[] => {
    try {
      if (mode === 'day') return singleDate ? [singleDate] : [];
      if (mode === 'range' && rangeFrom && rangeTo) {
        const days = eachDayOfInterval({ start: parseISO(rangeFrom), end: parseISO(rangeTo) });
        return days.map(d => format(d, 'yyyy-MM-dd'));
      }
      if (mode === 'week' && weekDate) {
        const ref = parseISO(weekDate);
        const days = eachDayOfInterval({
          start: startOfWeek(ref, { weekStartsOn: 1 }),
          end:   endOfWeek(ref,   { weekStartsOn: 1 }),
        });
        return days.map(d => format(d, 'yyyy-MM-dd'));
      }
      if (mode === 'month' && monthDate) {
        const ref = parseISO(monthDate + '-01');
        const days = eachDayOfInterval({ start: startOfMonth(ref), end: endOfMonth(ref) });
        return days.map(d => format(d, 'yyyy-MM-dd'));
      }
    } catch { /* invalid date */ }
    return [];
  };

  const datesToAdd = getDatesToAdd();
  const newDates = datesToAdd.filter(d => !dayOffs.some(f => f.date === d));

  const addMutation = useMutation({
    mutationFn: async () => {
      for (const date of newDates) {
        await api.post(`/api/professionals/${myProfessional.id}/day-offs`, {
          date,
          reason: reason.trim() || undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-offs', myProfessional?.id] });
      setSingleDate(''); setRangeFrom(''); setRangeTo('');
      setWeekDate(''); setMonthDate(''); setReason('');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (dayOffId: string) =>
      api.delete(`/api/professionals/${myProfessional.id}/day-offs/${dayOffId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['day-offs', myProfessional?.id] }),
  });

  const upcoming = dayOffs.filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past     = dayOffs.filter(d => d.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const modeLabels: Record<SelectionMode, string> = {
    day:   'Dia específico',
    range: 'Período',
    week:  'Semana inteira',
    month: 'Mês inteiro',
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Minhas Folgas</h1>
        <p className="text-muted-foreground text-sm">Gerencie seus dias de folga</p>
      </div>

      {/* Add form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-medium text-foreground text-sm">Adicionar folga</h2>

        {/* Mode selector */}
        <div className="grid grid-cols-4 gap-1 bg-background rounded-lg p-1 border border-input">
          {(Object.keys(modeLabels) as SelectionMode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${
                mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Date inputs by mode */}
        {mode === 'day' && (
          <input type="date" value={singleDate} min={today} onChange={e => setSingleDate(e.target.value)} className={`w-full ${inputCls}`} />
        )}
        {mode === 'range' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">De</label>
              <input type="date" value={rangeFrom} min={today} onChange={e => setRangeFrom(e.target.value)} className={`w-full ${inputCls}`} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Até</label>
              <input type="date" value={rangeTo} min={rangeFrom || today} onChange={e => setRangeTo(e.target.value)} className={`w-full ${inputCls}`} />
            </div>
          </div>
        )}
        {mode === 'week' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Qualquer dia da semana desejada</label>
            <input type="date" value={weekDate} min={today} onChange={e => setWeekDate(e.target.value)} className={`w-full ${inputCls}`} />
            {weekDate && (
              <p className="text-xs text-muted-foreground mt-1.5">
                Semana: {format(startOfWeek(parseISO(weekDate), { weekStartsOn: 1 }), "d MMM", { locale: ptBR })} →{' '}
                {format(endOfWeek(parseISO(weekDate), { weekStartsOn: 1 }), "d MMM yyyy", { locale: ptBR })}
              </p>
            )}
          </div>
        )}
        {mode === 'month' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Mês</label>
            <input type="month" value={monthDate} onChange={e => setMonthDate(e.target.value)} className={`w-full ${inputCls}`} />
          </div>
        )}

        {/* Reason */}
        <input
          type="text"
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Motivo (opcional) — ex: Férias, Consulta médica..."
          className={`w-full ${inputCls}`}
        />

        {/* Preview */}
        {newDates.length > 0 && (
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            {newDates.length === 1
              ? `1 folga será adicionada`
              : `${newDates.length} dias de folga serão adicionados`}
            {datesToAdd.length > newDates.length && ` (${datesToAdd.length - newDates.length} já cadastrado${datesToAdd.length - newDates.length > 1 ? 's' : ''})`}
          </p>
        )}

        <button
          onClick={() => newDates.length > 0 && addMutation.mutate()}
          disabled={newDates.length === 0 || addMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {addMutation.isPending ? 'Adicionando...' : 'Adicionar folga'}
        </button>
      </div>

      {/* List */}
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
                      disabled={removeMutation.isPending}
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
                {past.slice(0, 10).map(d => (
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
  );
}
