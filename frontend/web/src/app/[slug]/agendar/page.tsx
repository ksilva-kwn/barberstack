'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Scissors, ArrowLeft, Loader2, Check, LogOut } from 'lucide-react';
import { portalApi } from '@/lib/public.api';

const inputCls =
  'w-full px-3 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors';

export default function PortalAgendarPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [portalUser, setPortalUser] = useState<any>(null);

  const [professionalId, setProfessionalId] = useState('');
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Auth check
  useEffect(() => {
    const raw = sessionStorage.getItem(`portal-auth-${slug}`);
    if (!raw) {
      router.replace(`/${slug}/entrar`);
      return;
    }
    const { token, user } = JSON.parse(raw);
    setPortalToken(token);
    setPortalUser(user);
  }, [slug, router]);

  const { data: shop } = useQuery({
    queryKey: ['public-shop', slug],
    queryFn: () => portalApi.shop(slug).then(r => r.data),
  });

  const { data: professionals = [] } = useQuery({
    queryKey: ['public-professionals', slug],
    queryFn: () => portalApi.professionals(slug).then(r => r.data),
    enabled: !!shop,
  });

  // Set default professional once loaded
  useEffect(() => {
    if (professionals.length > 0 && !professionalId) {
      setProfessionalId(professionals[0].id);
    }
  }, [professionals, professionalId]);

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
    queryKey: ['portal-slots', shop?.id, professionalId, scheduledDate, totalDuration],
    queryFn: () => portalApi.slots(shop!.id, professionalId, scheduledDate, totalDuration).then(r => r.data),
    enabled: !!shop && !!professionalId && !!scheduledDate && totalDuration > 0,
  });

  const toggleService = (id: string) =>
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceIds.length) { setError('Selecione ao menos um serviço'); return; }
    if (!selectedTime) { setError('Selecione um horário'); return; }
    if (!portalToken) return;
    setError('');
    setSubmitting(true);

    try {
      await portalApi.createAppointment(portalToken, {
        professionalId,
        // Força UTC-3 (BRT) para evitar conversão errada no browser
        scheduledAt: `${scheduledDate}T${selectedTime}:00-03:00`,
        serviceIds: selectedServiceIds,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (err: any) {
      const raw = err.response?.data?.error;
      setError(typeof raw === 'string' ? raw : 'Erro ao criar agendamento');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`portal-auth-${slug}`);
    router.push(`/${slug}`);
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Agendamento confirmado!</h1>
          <p className="text-muted-foreground mb-2">
            {format(new Date(`${scheduledDate}T${selectedTime}:00`), "dd/MM/yyyy 'às' HH:mm")}
          </p>
          {professional && (
            <p className="text-sm text-muted-foreground mb-8">
              com {professional.nickname ?? professional.user.name}
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSuccess(false);
                setSelectedServiceIds([]);
                setSelectedTime('');
                setNotes('');
              }}
              className="flex-1 py-3 rounded-xl border border-border text-foreground text-sm font-medium hover:bg-accent transition-colors"
            >
              Novo agendamento
            </button>
            <button
              onClick={() => router.push(`/${slug}`)}
              className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Voltar ao início
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push(`/${slug}`)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {shop?.logoUrl ? (
              <img src={shop.logoUrl} alt={shop?.name} className="w-7 h-7 rounded-lg object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <Scissors className="w-3.5 h-3.5 text-primary-foreground" />
              </div>
            )}
            <span className="font-semibold text-foreground text-sm truncate">{shop?.name ?? '...'}</span>
          </div>

          {portalUser && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-muted-foreground hidden sm:block">
                {portalUser.name.split(' ')[0]}
              </span>
              <button
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Form */}
      <div className="flex-1 max-w-lg mx-auto w-full px-4 py-8">
        <h1 className="text-xl font-bold text-foreground mb-6">Novo agendamento</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profissional */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Profissional</label>
            <select
              value={professionalId}
              onChange={e => setProfessionalId(e.target.value)}
              className={inputCls}
            >
              {professionals.map(p => (
                <option key={p.id} value={p.id}>{p.nickname ?? p.user.name}</option>
              ))}
            </select>
          </div>

          {/* Serviços */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Serviços</label>
            {availableServices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum serviço disponível para este profissional.</p>
            ) : (
              <div className="space-y-2">
                {availableServices.map(s => {
                  const selected = selectedServiceIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${
                        selected
                          ? 'border-primary bg-primary/10 text-foreground'
                          : 'border-border bg-background text-foreground hover:bg-accent'
                      }`}
                    >
                      <span className="font-medium">{s.name}</span>
                      <span className="text-muted-foreground text-xs shrink-0 ml-4">
                        {s.durationMins}min · R$ {Number(s.price).toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {selectedServices.length > 0 && (
              <div className="flex justify-between text-sm text-muted-foreground bg-muted/30 px-4 py-2.5 rounded-xl mt-3">
                <span>{totalDuration} minutos no total</span>
                <span className="font-semibold text-foreground">
                  R$ {totalAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Data</label>
            <input
              type="date"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              min={format(new Date(), 'yyyy-MM-dd')}
              className={inputCls}
            />
          </div>

          {/* Horários */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Horário
              {selectedTime && (
                <span className="ml-2 text-primary font-semibold">{selectedTime}</span>
              )}
            </label>
            {!professionalId || totalDuration === 0 ? (
              <p className="text-sm text-muted-foreground">Selecione profissional e serviços primeiro.</p>
            ) : loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Carregando horários...
              </div>
            ) : slots.filter(s => s.available).length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum horário disponível nesta data.</p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={!slot.available}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    className={`py-2 rounded-lg text-xs font-medium transition-colors ${
                      !slot.available
                        ? 'bg-muted/30 text-muted-foreground/40 cursor-not-allowed line-through'
                        : selectedTime === slot.time
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background border border-border text-foreground hover:bg-accent hover:border-primary/50'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Observações <span className="text-muted-foreground font-normal">(opcional)</span>
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Ex: prefiro navalha, alergia a algum produto..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Agendando...' : 'Confirmar agendamento'}
          </button>
        </form>
      </div>
    </div>
  );
}
