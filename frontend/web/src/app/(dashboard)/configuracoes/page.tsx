'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Loader2, Building2, Phone, Mail, MapPin, Hash } from 'lucide-react';
import { barbershopApi, BarbershopSettings } from '@/lib/barbershop.api';
import { useAuthStore } from '@/store/auth.store';

const inputCls =
  'w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors';

export default function ConfiguracoesPage() {
  const { user } = useAuthStore();
  const barbershopId = user?.barbershopId ?? '';
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });

  const { data: shop, isLoading } = useQuery({
    queryKey: ['barbershop-settings', barbershopId],
    queryFn: () => barbershopApi.getPortal(barbershopId).then(r => r.data as unknown as BarbershopSettings),
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

  const mutation = useMutation({
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

  const set = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Dados gerais da barbearia — nome, contato e endereço.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl divide-y divide-border">
        {/* Dados principais */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Dados da Barbearia</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nome da barbearia</label>
            <input
              className={inputCls}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="Ex: Barbearia do João"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Telefone</span>
              </label>
              <input
                className={inputCls}
                value={form.phone}
                onChange={e => set('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />E-mail</span>
              </label>
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="contato@barbearia.com"
              />
            </div>
          </div>

          {shop && (
            <div className="flex items-center gap-2 px-3 py-2 bg-muted/30 rounded-lg">
              <Hash className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs text-muted-foreground">CNPJ/CPF: <span className="font-mono text-foreground">{(shop as any).document ?? '—'}</span></span>
            </div>
          )}
        </div>

        {/* Endereço */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-medium text-foreground text-sm">Endereço</h3>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Endereço</label>
            <input
              className={inputCls}
              value={form.address}
              onChange={e => set('address', e.target.value)}
              placeholder="Rua, número, complemento"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Cidade</label>
              <input
                className={inputCls}
                value={form.city}
                onChange={e => set('city', e.target.value)}
                placeholder="São Paulo"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Estado</label>
              <input
                className={inputCls}
                value={form.state}
                onChange={e => set('state', e.target.value.toUpperCase().slice(0, 2))}
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </div>

          <div className="max-w-[160px]">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">CEP</label>
            <input
              className={inputCls}
              value={form.zipCode}
              onChange={e => set('zipCode', e.target.value)}
              placeholder="00000-000"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {saved && <p className="text-sm text-emerald-400">Configurações salvas!</p>}
        {mutation.isError && <p className="text-sm text-destructive">Erro ao salvar. Tente novamente.</p>}
        {!saved && !mutation.isError && <span />}
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>
    </div>
  );
}
