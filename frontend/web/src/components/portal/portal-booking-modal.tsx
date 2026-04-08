'use client';

import { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Check } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { portalApi, PublicShop, PublicProfessional } from '@/lib/public.api';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

interface Props {
  shop: PublicShop;
  professionals: PublicProfessional[];
  token: string;
  onClose: () => void;
  onBooked: () => void;
}

export function PortalBookingModal({ shop, professionals, token, onClose, onBooked }: Props) {
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? '');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const professional = professionals.find(p => p.id === professionalId);
  const availableServices = (professional?.professionalServices ?? [])
    .map(ps => ps.service)
    .filter(s => s.isActive);

  const selectedServices = availableServices.filter(s => selectedServiceIds.includes(s.id));
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMins, 0);
  const totalAmount = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);

  useEffect(() => { setSelectedServiceIds([]); setSelectedTime(''); }, [professionalId]);
  useEffect(() => { setSelectedTime(''); }, [scheduledDate, selectedServiceIds]);

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['portal-slots', shop.id, professionalId, scheduledDate, totalDuration],
    queryFn: () => portalApi.slots(shop.id, professionalId, scheduledDate, totalDuration).then(r => r.data),
    enabled: !!professionalId && !!scheduledDate && totalDuration > 0,
  });

  const toggleService = (id: string) =>
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceIds.length) { setError('Selecione ao menos um serviço'); return; }
    if (!selectedTime) { setError('Selecione um horário'); return; }
    setError(''); setSubmitting(true);

    try {
      await portalApi.createAppointment(token, {
        professionalId,
        scheduledAt: new Date(`${scheduledDate}T${selectedTime}:00`).toISOString(),
        serviceIds: selectedServiceIds,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao criar agendamento');
    } finally { setSubmitting(false); }
  };

  if (success) {
    return (
      <Dialog.Root open onOpenChange={o => !o && onBooked()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
          <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-card border border-border rounded-xl shadow-xl p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Agendamento confirmado!</h2>
            <p className="text-sm text-muted-foreground mb-5">
              {format(new Date(`${scheduledDate}T${selectedTime}:00`), "dd/MM/yyyy 'às' HH:mm")}
            </p>
            <button onClick={onBooked} className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Fechar
            </button>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open onOpenChange={o => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <Dialog.Content className="fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg max-h-[92vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="text-lg font-semibold text-foreground">Novo Agendamento</Dialog.Title>
            <Dialog.Close className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Profissional */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Profissional</label>
              <select value={professionalId} onChange={e => setProfessionalId(e.target.value)} className={inputCls}>
                {professionals.map(p => (
                  <option key={p.id} value={p.id}>{p.nickname ?? p.user.name}</option>
                ))}
              </select>
            </div>

            {/* Serviços */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Serviços</label>
              {availableServices.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum serviço disponível para este profissional.</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableServices.map(s => {
                    const selected = selectedServiceIds.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                          selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background text-foreground hover:bg-accent'
                        }`}>
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-xs">{s.durationMins}min · R$ {Number(s.price).toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedServices.length > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg mt-2">
                  <span>{totalDuration} min</span>
                  <span className="font-medium text-foreground">R$ {totalAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Data</label>
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')} className={inputCls} />
            </div>

            {/* Horários */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Horário
                {selectedTime && <span className="ml-2 text-primary font-semibold">{selectedTime}</span>}
              </label>
              {!professionalId || totalDuration === 0 ? (
                <p className="text-sm text-muted-foreground">Selecione profissional e serviços primeiro.</p>
              ) : loadingSlots ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />Carregando horários...
                </div>
              ) : slots.filter(s => s.available).length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>
              ) : (
                <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {slots.map(slot => (
                    <button key={slot.time} type="button" disabled={!slot.available}
                      onClick={() => slot.available && setSelectedTime(slot.time)}
                      className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        !slot.available
                          ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed line-through'
                          : selectedTime === slot.time
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-background border border-border text-foreground hover:bg-accent hover:border-primary/50'
                      }`}>
                      {slot.time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Observações <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Ex: prefiro navalha..." className={`${inputCls} resize-none`} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={submitting}
                className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? 'Agendando...' : 'Confirmar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
