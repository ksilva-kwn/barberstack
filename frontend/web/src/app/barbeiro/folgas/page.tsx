'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO, eachDayOfInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, X, CalendarOff, Loader2, Clock, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

interface DayOff {
  id: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

interface RecurringBlock {
  id: string;
  dayOfWeek: number | null;
  startTime: string;
  endTime: string;
  reason: string | null;
}

type SelectionMode = 'day' | 'range' | 'week' | 'month';

const inputCls = 'px-3 py-2 rounded-lg bg-background border border-input text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground';

const DOW_LABELS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export default function FolgasPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const today = format(new Date(), 'yyyy-MM-dd');

  // ── Folgas ───────────────────────────────────────────────────────────────────
  const [mode, setMode]           = useState<SelectionMode>('day');
  const [singleDate, setSingleDate] = useState('');
  const [rangeFrom,  setRangeFrom]  = useState('');
  const [rangeTo,    setRangeTo]    = useState('');
  const [weekDate,   setWeekDate]   = useState('');
  const [monthDate,  setMonthDate]  = useState('');
  const [reason,     setReason]     = useState('');
  const [useTimeRange, setUseTimeRange] = useState(false);
  const [startTime,  setStartTime]  = useState('12:00');
  const [endTime,    setEndTime]    = useState('13:00');

  // ── Bloqueios recorrentes ─────────────────────────────────────────────────────
  const [rbDow,       setRbDow]       = useState<string>('');   // '' = todos os dias
  const [rbStart,     setRbStart]     = useState('12:00');
  const [rbEnd,       setRbEnd]       = useState('13:00');
  const [rbReason,    setRbReason]    = useState('');

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

  const { data: recurringBlocks = [] } = useQuery<RecurringBlock[]>({
    queryKey: ['recurring-blocks', myProfessional?.id],
    queryFn: () => api.get(`/api/professionals/${myProfessional.id}/recurring-blocks`).then(r => r.data),
    enabled: !!myProfessional,
  });

  // ── Datas a adicionar ─────────────────────────────────────────────────────────
  const getDatesToAdd = (): string[] => {
    try {
      if (mode === 'day')   return singleDate ? [singleDate] : [];
      if (mode === 'range' && rangeFrom && rangeTo)
        return eachDayOfInterval({ start: parseISO(rangeFrom), end: parseISO(rangeTo) }).map(d => format(d, 'yyyy-MM-dd'));
      if (mode === 'week' && weekDate) {
        const ref = parseISO(weekDate);
        return eachDayOfInterval({ start: startOfWeek(ref, { weekStartsOn: 1 }), end: endOfWeek(ref, { weekStartsOn: 1 }) }).map(d => format(d, 'yyyy-MM-dd'));
      }
      if (mode === 'month' && monthDate) {
        const ref = parseISO(monthDate + '-01');
        return eachDayOfInterval({ start: startOfMonth(ref), end: endOfMonth(ref) }).map(d => format(d, 'yyyy-MM-dd'));
      }
    } catch { /* invalid date */ }
    return [];
  };

  const datesToAdd = getDatesToAdd();
  const newDates   = datesToAdd.filter(d => !dayOffs.some(f => f.date === d));

  const addDayOffMutation = useMutation({
    mutationFn: async () => {
      for (const date of newDates) {
        await api.post(`/api/professionals/${myProfessional.id}/day-offs`, {
          date,
          reason: reason.trim() || undefined,
          startTime: useTimeRange ? startTime : undefined,
          endTime:   useTimeRange ? endTime   : undefined,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['day-offs', myProfessional?.id] });
      setSingleDate(''); setRangeFrom(''); setRangeTo('');
      setWeekDate(''); setMonthDate(''); setReason('');
    },
  });

  const removeDayOffMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/professionals/${myProfessional.id}/day-offs/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['day-offs', myProfessional?.id] }),
  });

  const addRecurringMutation = useMutation({
    mutationFn: () => api.post(`/api/professionals/${myProfessional.id}/recurring-blocks`, {
      dayOfWeek: rbDow !== '' ? Number(rbDow) : undefined,
      startTime: rbStart,
      endTime:   rbEnd,
      reason:    rbReason.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurring-blocks', myProfessional?.id] });
      setRbDow(''); setRbStart('12:00'); setRbEnd('13:00'); setRbReason('');
    },
  });

  const removeRecurringMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/professionals/${myProfessional.id}/recurring-blocks/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recurring-blocks', myProfessional?.id] }),
  });

  const upcoming = dayOffs.filter(d => d.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  const past     = dayOffs.filter(d => d.date < today).sort((a, b) => b.date.localeCompare(a.date));

  const modeLabels: Record<SelectionMode, string> = {
    day: 'Dia', range: 'Período', week: 'Semana', month: 'Mês',
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Folgas & Bloqueios</h1>
        <p className="text-muted-foreground text-sm">Gerencie seus dias livres e horários fixos bloqueados</p>
      </div>

      {/* ── Adicionar folga ─────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <CalendarOff className="w-4 h-4 text-red-400" />
          Adicionar folga
        </h2>

        {/* Mode selector */}
        <div className="grid grid-cols-4 gap-1 bg-background rounded-lg p-1 border border-input">
          {(Object.keys(modeLabels) as SelectionMode[]).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)}
              className={`py-1.5 px-2 rounded text-xs font-medium transition-colors ${mode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
              {modeLabels[m]}
            </button>
          ))}
        </div>

        {/* Date inputs */}
        {mode === 'day' && (
          <input type="date" value={singleDate} min={today} onChange={e => setSingleDate(e.target.value)} className={`w-full ${inputCls}`} />
        )}
        {mode === 'range' && (
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground mb-1 block">De</label>
              <input type="date" value={rangeFrom} min={today} onChange={e => setRangeFrom(e.target.value)} className={`w-full ${inputCls}`} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Até</label>
              <input type="date" value={rangeTo} min={rangeFrom || today} onChange={e => setRangeTo(e.target.value)} className={`w-full ${inputCls}`} /></div>
          </div>
        )}
        {mode === 'week' && (
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Qualquer dia da semana</label>
            <input type="date" value={weekDate} min={today} onChange={e => setWeekDate(e.target.value)} className={`w-full ${inputCls}`} />
            {weekDate && (
              <p className="text-xs text-muted-foreground mt-1.5">
                {format(startOfWeek(parseISO(weekDate), { weekStartsOn: 1 }), "d MMM", { locale: ptBR })} → {format(endOfWeek(parseISO(weekDate), { weekStartsOn: 1 }), "d MMM yyyy", { locale: ptBR })}
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

        {/* Optional time range */}
        <div>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-foreground">
            <input type="checkbox" checked={useTimeRange} onChange={e => setUseTimeRange(e.target.checked)}
              className="w-4 h-4 rounded border-input accent-primary" />
            Horário específico (não o dia inteiro)
          </label>
          {useTimeRange && (
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div><label className="text-xs text-muted-foreground mb-1 block">Início</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className={`w-full ${inputCls}`} /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">Fim</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className={`w-full ${inputCls}`} /></div>
            </div>
          )}
        </div>

        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
          placeholder="Motivo (opcional) — ex: Férias, Consulta médica..."
          className={`w-full ${inputCls}`} />

        {newDates.length > 0 && (
          <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
            {newDates.length === 1 ? '1 folga será adicionada' : `${newDates.length} dias serão adicionados`}
            {datesToAdd.length > newDates.length && ` (${datesToAdd.length - newDates.length} já cadastrado${datesToAdd.length - newDates.length > 1 ? 's' : ''})`}
          </p>
        )}

        <button onClick={() => newDates.length > 0 && addDayOffMutation.mutate()}
          disabled={newDates.length === 0 || addDayOffMutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {addDayOffMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {addDayOffMutation.isPending ? 'Adicionando...' : 'Adicionar folga'}
        </button>
      </div>

      {/* ── Bloqueios recorrentes ──────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-orange-400" />
          Bloqueios recorrentes
          <span className="text-xs font-normal text-muted-foreground">(ex: almoço todo dia)</span>
        </h2>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Dia da semana</label>
            <select value={rbDow} onChange={e => setRbDow(e.target.value)} className={`w-full ${inputCls}`}>
              <option value="">Todos os dias</option>
              {DOW_LABELS.map((label, i) => (
                <option key={i} value={i}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-xs text-muted-foreground mb-1 block">Início</label>
              <input type="time" value={rbStart} onChange={e => setRbStart(e.target.value)} className={`w-full ${inputCls}`} /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">Fim</label>
              <input type="time" value={rbEnd} onChange={e => setRbEnd(e.target.value)} className={`w-full ${inputCls}`} /></div>
          </div>

          <input type="text" value={rbReason} onChange={e => setRbReason(e.target.value)}
            placeholder="Descrição — ex: Almoço, Pausa, Treino..."
            className={`w-full ${inputCls}`} />

          <button onClick={() => rbStart && rbEnd && addRecurringMutation.mutate()}
            disabled={!rbStart || !rbEnd || addRecurringMutation.isPending}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm font-medium hover:bg-orange-500/30 disabled:opacity-50 transition-colors">
            {addRecurringMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Adicionar bloqueio recorrente
          </button>
        </div>

        {recurringBlocks.length > 0 && (
          <div className="border-t border-border pt-3 space-y-2">
            {recurringBlocks.map(b => (
              <div key={b.id} className="flex items-center justify-between bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {b.dayOfWeek != null ? DOW_LABELS[b.dayOfWeek] : 'Todos os dias'} · {b.startTime}–{b.endTime}
                  </p>
                  {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
                </div>
                <button onClick={() => removeRecurringMutation.mutate(b.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Lista de folgas ──────────────────────────────────────────────────── */}
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
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {d.startTime && d.endTime
                          ? <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{d.startTime}–{d.endTime}{d.reason ? ` · ${d.reason}` : ''}</span>
                          : d.reason ?? 'Dia inteiro'}
                      </p>
                    </div>
                    <button onClick={() => removeDayOffMutation.mutate(d.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcoming.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">
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
                    {d.startTime && d.endTime
                      ? <p className="text-xs text-muted-foreground">{d.startTime}–{d.endTime}</p>
                      : d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
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
