'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { Appointment, appointmentApi } from '@/lib/appointment.api';
import { BarbershopService } from '@/lib/barbershop.api';

interface Props {
  appointment: Appointment;
  services: BarbershopService[];
  onClose: () => void;
  onSaved: () => void;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

export function EditAppointmentModal({ appointment, services, onClose, onSaved }: Props) {
  const scheduled = new Date(appointment.scheduledAt);
  const [clientName, setClientName] = useState(appointment.client?.name ?? appointment.clientName ?? '');
  const [date, setDate] = useState(format(scheduled, 'yyyy-MM-dd'));
  const [time, setTime] = useState(format(scheduled, 'HH:mm'));
  const [notes, setNotes] = useState(appointment.notes ?? '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(
    appointment.services.map(s => s.serviceId)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!date || !time) { setError('Informe a data e o horário.'); return; }
    if (selectedServiceIds.length === 0) { setError('Selecione ao menos um serviço.'); return; }
    setSaving(true);
    setError('');
    try {
      const scheduledAt = new Date(`${date}T${time}`).toISOString();
      await appointmentApi.update(appointment.id, {
        clientName: clientName || undefined,
        notes: notes || undefined,
        serviceIds: selectedServiceIds,
        scheduledAt,
      });
      onSaved();
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-semibold text-foreground">Editar agendamento</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Client */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Cliente</span>
            <input
              className={inputCls}
              placeholder="Nome do cliente"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
            />
          </label>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data</span>
              <input
                type="date"
                className={inputCls}
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Horário</span>
              <input
                type="time"
                className={inputCls}
                value={time}
                onChange={e => setTime(e.target.value)}
              />
            </label>
          </div>

          {/* Services */}
          {services.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Serviços</span>
              <div className="flex flex-col gap-1">
                {services.map(s => {
                  const checked = selectedServiceIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border cursor-pointer hover:bg-accent transition-colors"
                      style={{ borderColor: checked ? 'hsl(var(--primary))' : undefined, background: checked ? 'hsl(var(--primary)/0.06)' : undefined }}
                    >
                      <span
                        className="flex items-center justify-center w-4 h-4 rounded border flex-shrink-0"
                        style={{
                          background: checked ? 'hsl(var(--primary))' : 'transparent',
                          borderColor: checked ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                          transition: 'background 0.15s, border-color 0.15s',
                        }}
                      >
                        {checked && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary-foreground))" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </span>
                      <input type="checkbox" checked={checked} onChange={() => toggleService(s.id)} className="sr-only" />
                      <span className="text-sm text-foreground flex-1">{s.name}</span>
                      <span className="text-xs text-muted-foreground">{s.durationMins}min</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Observações</span>
            <textarea
              className={inputCls}
              placeholder="Observações opcionais"
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              style={{ resize: 'none' }}
            />
          </label>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-3 border-t border-border shrink-0 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}
