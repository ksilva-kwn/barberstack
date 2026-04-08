'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { appointmentApi, CreateAppointmentPayload } from '@/lib/appointment.api';
import { Professional, BarbershopService } from '@/lib/barbershop.api';

interface Props {
  professionals: Professional[];
  services: BarbershopService[];
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

export function NewAppointmentModal({ professionals, services, defaultDate, onClose, onCreated }: Props) {
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? '');
  const [clientName, setClientName] = useState('');
  const [scheduledDate, setScheduledDate] = useState(format(defaultDate, 'yyyy-MM-dd'));
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [origin, setOrigin] = useState<'RECEPTION' | 'APP'>('RECEPTION');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const activeServices = services.filter((s) => s.isActive);

  const selectedServices = activeServices.filter((s) => selectedServiceIds.includes(s.id));
  const totalAmount = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMins, 0);

  const toggleService = (id: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId) { setError('Selecione um profissional'); return; }
    if (!clientName.trim()) { setError('Informe o nome do cliente'); return; }
    if (selectedServiceIds.length === 0) { setError('Selecione ao menos um serviço'); return; }

    setError('');
    setSubmitting(true);

    const scheduledAt = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

    const payload: CreateAppointmentPayload = {
      professionalId,
      clientName: clientName.trim(),
      scheduledAt,
      serviceIds: selectedServiceIds,
      notes: notes.trim() || undefined,
      origin,
    };

    try {
      await appointmentApi.create(payload);
      onCreated();
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">
              Novo Agendamento
            </Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profissional */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Profissional</label>
              <select
                value={professionalId}
                onChange={(e) => setProfessionalId(e.target.value)}
                className={inputCls}
              >
                {professionals.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nickname ?? p.user.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Nome do cliente</label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: João Silva"
                className={inputCls}
              />
            </div>

            {/* Data + Hora */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Data</label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Horário</label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            {/* Serviços */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Serviços</label>
              {activeServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum serviço cadastrado. Adicione serviços nas configurações.
                </p>
              ) : (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {activeServices.map((s) => {
                    const selected = selectedServiceIds.includes(s.id);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleService(s.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                          selected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border bg-background text-foreground hover:bg-accent'
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {s.durationMins}min · R$ {Number(s.price).toFixed(2)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totais */}
            {selectedServices.length > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-lg">
                <span>{totalDuration} min</span>
                <span className="font-medium text-foreground">R$ {totalAmount.toFixed(2)}</span>
              </div>
            )}

            {/* Origem */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Origem</label>
              <div className="flex gap-2">
                {(['RECEPTION', 'APP'] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => setOrigin(o)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      origin === o
                        ? 'border-primary bg-primary/10 text-foreground'
                        : 'border-border bg-background text-muted-foreground hover:bg-accent'
                    }`}
                  >
                    {o === 'RECEPTION' ? 'Recepção' : 'App'}
                  </button>
                ))}
              </div>
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Observações <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Ex: cliente prefere navalha..."
                className={`${inputCls} resize-none`}
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Criando...' : 'Criar Agendamento'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
