'use client';

import { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Loader2, Search, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { appointmentApi, CreateAppointmentPayload } from '@/lib/appointment.api';
import { barbershopApi, Professional, BarbershopService, Client } from '@/lib/barbershop.api';

interface Props {
  professionals: Professional[];
  services: BarbershopService[];
  defaultDate: Date;
  onClose: () => void;
  onCreated: () => void;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

// ─── Client search combobox ───────────────────────────────────────────────────
function ClientSearch({ value, onChange }: {
  value: Client | null;
  onChange: (c: Client | null) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: clients = [], isFetching } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => barbershopApi.clients(search || undefined).then(r => r.data),
    enabled: open,
  });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = (client: Client) => {
    onChange(client);
    setSearch('');
    setOpen(false);
  };

  const clear = () => { onChange(null); setSearch(''); };

  return (
    <div ref={ref} className="relative">
      {value ? (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-primary text-sm">
          <div>
            <span className="font-medium text-foreground">{value.name}</span>
            {value.phone && <span className="text-muted-foreground ml-2">{value.phone}</span>}
          </div>
          <button type="button" onClick={clear} className="text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Buscar cliente por nome ou telefone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
          />
        </div>
      )}

      {open && !value && (
        <div className="absolute z-50 w-full top-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {isFetching ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : clients.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground text-center">
              Nenhum cliente encontrado.{' '}
              <a href="/clientes" className="text-primary hover:underline" onClick={e => e.stopPropagation()}>
                Cadastrar cliente
              </a>
            </div>
          ) : (
            clients.map((c: Client) => (
              <button
                key={c.id}
                type="button"
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-accent text-left transition-colors"
                onClick={() => select(c)}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{c.name}</p>
                  {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
                </div>
                <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Time slot picker ─────────────────────────────────────────────────────────
function SlotPicker({ professionalId, date, durationMins, value, onChange }: {
  professionalId: string;
  date: string;
  durationMins: number;
  value: string;
  onChange: (t: string) => void;
}) {
  const { data: slots = [], isLoading } = useQuery({
    queryKey: ['slots', professionalId, date, durationMins],
    queryFn: () => appointmentApi.availableSlots(professionalId, date, durationMins).then(r => r.data),
    enabled: !!professionalId && !!date && durationMins > 0,
  });

  if (!professionalId || !date || durationMins === 0) {
    return <p className="text-sm text-muted-foreground">Selecione profissional, serviços e data para ver horários.</p>;
  }

  if (isLoading) {
    return <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" />Carregando horários...</div>;
  }

  const available = slots.filter(s => s.available);
  if (available.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhum horário disponível nesta data.</p>;
  }

  return (
    <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto pr-1">
      {slots.map(slot => (
        <button
          key={slot.time}
          type="button"
          disabled={!slot.available}
          onClick={() => slot.available && onChange(slot.time)}
          className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
            !slot.available
              ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed line-through'
              : value === slot.time
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-border text-foreground hover:bg-accent hover:border-primary/50'
          }`}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function NewAppointmentModal({ professionals, services, defaultDate, onClose, onCreated }: Props) {
  const [professionalId, setProfessionalId] = useState(professionals[0]?.id ?? '');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [scheduledDate, setScheduledDate] = useState(format(defaultDate, 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [origin, setOrigin] = useState<'RECEPTION' | 'APP'>('RECEPTION');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Services for selected professional (if assigned), otherwise all active services
  const professional = professionals.find(p => p.id === professionalId);
  const profServices = professional?.professionalServices;
  const availableServices = profServices && profServices.length > 0
    ? profServices.map(ps => ps.service).filter(s => s.isActive)
    : services.filter(s => s.isActive);

  // Reset selected services and time when professional changes
  useEffect(() => {
    setSelectedServiceIds([]);
    setSelectedTime('');
  }, [professionalId]);

  // Reset time when date or services change
  useEffect(() => { setSelectedTime(''); }, [scheduledDate, selectedServiceIds]);

  const toggleService = (id: string) =>
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const selectedServices = availableServices.filter(s => selectedServiceIds.includes(s.id));
  const totalAmount = selectedServices.reduce((sum, s) => sum + Number(s.price), 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.durationMins, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!professionalId) { setError('Selecione um profissional'); return; }
    if (!selectedClient) { setError('Selecione um cliente'); return; }
    if (selectedServiceIds.length === 0) { setError('Selecione ao menos um serviço'); return; }
    if (!selectedTime) { setError('Selecione um horário'); return; }

    setError(''); setSubmitting(true);

    const scheduledAt = `${scheduledDate}T${selectedTime}:00-03:00`;

    const payload: CreateAppointmentPayload = {
      professionalId,
      clientId: selectedClient.id,
      scheduledAt,
      serviceIds: selectedServiceIds,
      notes: notes.trim() || undefined,
      origin,
    };

    try {
      await appointmentApi.create(payload);
      onCreated();
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao criar agendamento');
    } finally { setSubmitting(false); }
  };

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
                <p className="text-sm text-muted-foreground">
                  {professional?.professionalServices?.length === 0
                    ? 'Este barbeiro não tem serviços atribuídos. Configure em Barbeiros.'
                    : 'Nenhum serviço cadastrado.'}
                </p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {availableServices.map(s => {
                    const selected = selectedServiceIds.includes(s.id);
                    return (
                      <button key={s.id} type="button" onClick={() => toggleService(s.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors ${
                          selected ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background text-foreground hover:bg-accent'
                        }`}
                      >
                        <span>{s.name}</span>
                        <span className="text-muted-foreground text-xs">{s.durationMins}min · R$ {Number(s.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedServices.length > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg mt-2">
                  <span>{totalDuration} min</span>
                  <span className="font-medium text-foreground">R$ {totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              )}
            </div>

            {/* Data */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Data</label>
              <input type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} className={inputCls} />
            </div>

            {/* Horários disponíveis */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Horário disponível
                {selectedTime && <span className="ml-2 text-primary font-semibold">{selectedTime}</span>}
              </label>
              <SlotPicker
                professionalId={professionalId}
                date={scheduledDate}
                durationMins={totalDuration}
                value={selectedTime}
                onChange={setSelectedTime}
              />
            </div>

            {/* Cliente */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Cliente</label>
              <ClientSearch value={selectedClient} onChange={setSelectedClient} />
            </div>

            {/* Origem */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Origem</label>
              <div className="flex gap-2">
                {(['RECEPTION', 'APP'] as const).map(o => (
                  <button key={o} type="button" onClick={() => setOrigin(o)}
                    className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      origin === o ? 'border-primary bg-primary/10 text-foreground' : 'border-border bg-background text-muted-foreground hover:bg-accent'
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
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                placeholder="Ex: cliente prefere navalha..." className={`${inputCls} resize-none`} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
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
