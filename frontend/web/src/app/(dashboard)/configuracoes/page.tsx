'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Building2, Phone, Mail, MapPin, Hash, Clock } from 'lucide-react';
import { barbershopApi, BarbershopSettings, BusinessHoursEntry } from '@/lib/barbershop.api';
import { useAuthStore } from '@/store/auth.store';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors';

const timeCls =
  'px-2 py-1.5 rounded-md bg-background border border-border text-foreground text-xs focus:outline-none focus:ring-1 focus:ring-primary/40 w-20 text-center';

const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const DEFAULT_HOURS: BusinessHoursEntry[] = Array.from({ length: 7 }, (_, i) => ({
  id: null,
  barbershopId: '',
  dayOfWeek: i,
  isOpen: i >= 1 && i <= 6, // Seg–Sáb aberto por padrão
  openTime: '09:00',
  closeTime: '18:00',
}));

// ─── Toggle switch ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40"
      style={{ backgroundColor: checked ? 'hsl(var(--primary))' : 'hsl(var(--muted))' }}
    >
      <span
        className="pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200"
        style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function ConfiguracoesPage() {
  const { user } = useAuthStore();
  const barbershopId = user?.barbershopId ?? '';
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const [hoursSaved, setHoursSaved] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', address: '', city: '', state: '', zipCode: '',
  });

  const [hours, setHours] = useState<BusinessHoursEntry[]>(DEFAULT_HOURS);

  // ── Queries ────────────────────────────────────────────────────────────

  const { data: shop, isLoading } = useQuery({
    queryKey: ['barbershop-settings', barbershopId],
    queryFn: () => barbershopApi.getPortal(barbershopId).then(r => r.data as unknown as BarbershopSettings),
    enabled: !!barbershopId,
  });

  const { data: hoursData } = useQuery({
    queryKey: ['business-hours', barbershopId],
    queryFn: () => barbershopApi.businessHours(barbershopId).then(r => r.data),
    enabled: !!barbershopId,
  });

  useEffect(() => {
    if (shop) {
      setForm({
        name:    (shop as any).name    ?? '',
        phone:   (shop as any).phone   ?? '',
        email:   (shop as any).email   ?? '',
        address: (shop as any).address ?? '',
        city:    (shop as any).city    ?? '',
        state:   (shop as any).state   ?? '',
        zipCode: (shop as any).zipCode ?? '',
      });
    }
  }, [shop]);

  useEffect(() => {
    if (hoursData && hoursData.length === 7) {
      setHours(hoursData);
    }
  }, [hoursData]);

  // ── Mutations ──────────────────────────────────────────────────────────

  const settingsMutation = useMutation({
    mutationFn: () =>
      barbershopApi.updateSettings(barbershopId, {
        name:    form.name    || undefined,
        phone:   form.phone   || undefined,
        email:   form.email   || undefined,
        address: form.address || null,
        city:    form.city    || null,
        state:   form.state   || null,
        zipCode: form.zipCode || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop-settings', barbershopId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const hoursMutation = useMutation({
    mutationFn: () =>
      barbershopApi.updateBusinessHours(barbershopId,
        hours.map(h => ({ dayOfWeek: h.dayOfWeek, isOpen: h.isOpen, openTime: h.openTime, closeTime: h.closeTime }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-hours', barbershopId] });
      setHoursSaved(true);
      setTimeout(() => setHoursSaved(false), 3000);
    },
  });

  // ── Helpers ────────────────────────────────────────────────────────────

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const setHourField = (dow: number, field: keyof BusinessHoursEntry, value: boolean | string) => {
    setHours(prev => prev.map(h => h.dayOfWeek === dow ? { ...h, [field]: value } : h));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dados gerais da barbearia — nome, contato e endereço.
        </p>
      </div>

      {/* ── Dados gerais ─────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Dados da Barbearia</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nome da barbearia</label>
            <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ex: Barbearia do João" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Telefone</span>
              </label>
              <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />E-mail</span>
              </label>
              <input className={inputCls} type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="contato@barbearia.com" />
            </div>
          </div>

          {shop && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
              <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">CNPJ/CPF: <span className="font-mono text-foreground">{(shop as any).document ?? '—'}</span></span>
            </div>
          )}
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Endereço</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Endereço</label>
            <input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Rua, número, complemento" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cidade</label>
              <input className={inputCls} value={form.city} onChange={e => set('city', e.target.value)} placeholder="São Paulo" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Estado</label>
              <input className={inputCls} value={form.state} onChange={e => set('state', e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" maxLength={2} />
            </div>
          </div>

          <div className="max-w-[160px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">CEP</label>
            <input className={inputCls} value={form.zipCode} onChange={e => set('zipCode', e.target.value)} placeholder="00000-000" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {saved && <p className="text-sm text-emerald-400">Configurações salvas!</p>}
        {settingsMutation.isError && <p className="text-sm text-destructive">Erro ao salvar. Tente novamente.</p>}
        {!saved && !settingsMutation.isError && <span />}
        <button
          onClick={() => settingsMutation.mutate()}
          disabled={settingsMutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {settingsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>

      {/* ── Horário de funcionamento ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-base">Horário de Funcionamento</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Configure os dias e horários em que a barbearia está aberta para agendamentos.
        </p>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {hours.map((h, idx) => (
            <div
              key={h.dayOfWeek}
              className="flex items-center gap-4 px-5 py-3.5"
              style={{ borderTop: idx > 0 ? '1px solid hsl(var(--border))' : undefined }}
            >
              {/* Day label */}
              <span className="w-8 text-sm font-semibold text-foreground shrink-0">
                {DAY_LABELS[h.dayOfWeek]}
              </span>

              {/* Toggle */}
              <Toggle checked={h.isOpen} onChange={v => setHourField(h.dayOfWeek, 'isOpen', v)} />

              {/* Time inputs or "Fechado" */}
              {h.isOpen ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    className={timeCls}
                    value={h.openTime}
                    onChange={e => setHourField(h.dayOfWeek, 'openTime', e.target.value)}
                  />
                  <span className="text-xs text-muted-foreground">às</span>
                  <input
                    type="time"
                    className={timeCls}
                    value={h.closeTime}
                    onChange={e => setHourField(h.dayOfWeek, 'closeTime', e.target.value)}
                  />
                </div>
              ) : (
                <span className="text-sm text-muted-foreground flex-1">Fechado</span>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          {hoursSaved && <p className="text-sm text-emerald-400">Horários salvos!</p>}
          {hoursMutation.isError && <p className="text-sm text-destructive">Erro ao salvar. Tente novamente.</p>}
          {!hoursSaved && !hoursMutation.isError && <span />}
          <button
            onClick={() => hoursMutation.mutate()}
            disabled={hoursMutation.isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {hoursMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar horários
          </button>
        </div>
      </div>
    </div>
  );
}
