'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';
import { barbershopApi } from '@/lib/barbershop.api';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { AppointmentOriginChart } from '@/components/dashboard/origin-chart';
import { Users, Scissors, TrendingUp, CreditCard, AlertTriangle, CalendarClock, Loader2, SlidersHorizontal, Plus, TrendingDown } from 'lucide-react';

const A = '#D4A24C';
const S = {
  card:         'hsl(var(--card))',
  border:       'hsl(var(--border))',
  text:         'hsl(var(--foreground))',
  textMuted:    'hsl(var(--muted-foreground))',
  bg:           'hsl(var(--background))',
};

const dashCss = `
  .dash-kpi-row { display: flex; gap: 12px; flex-wrap: wrap; }
  .dash-kpi-row > * { flex: 1; min-width: 0; }
  .dash-charts  { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
  .dash-bottom  { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  @media (max-width: 640px) {
    .dash-kpi-row > * { min-width: calc(50% - 6px); max-width: calc(50% - 6px); }
    .dash-charts  { grid-template-columns: 1fr; }
    .dash-bottom  { grid-template-columns: 1fr; }
  }
`;

function Sparkline({ positive = true }: { positive?: boolean }) {
  const color = positive ? A : '#f87171';
  const d = positive
    ? 'M0,28 L10,22 L20,25 L30,18 L40,20 L50,12 L60,15 L70,8 L80,10 L90,4 L100,6'
    : 'M0,6 L10,10 L20,8 L30,15 L40,12 L50,18 L60,16 L70,22 L80,20 L90,26 L100,24';
  return (
    <svg viewBox="0 0 100 32" style={{ width: 80, height: 32, flexShrink: 0 }}>
      <defs>
        <linearGradient id={`sg${positive?'p':'n'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={d + ' L100,32 L0,32 Z'} fill={`url(#sg${positive?'p':'n'})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface KpiData {
  title: string;
  value: string;
  delta?: string;
  positive?: boolean;
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger';
}

function KpiCard({ d }: { d: KpiData }) {
  const accentColor = d.variant === 'warning' ? '#f59e0b' : d.variant === 'danger' ? '#f87171' : undefined;
  const positive = d.positive !== false && d.variant !== 'danger';
  return (
    <div style={{
      background: S.card, border: `1px solid ${S.border}`, borderRadius: 14,
      padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
      flex: 1, minWidth: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d.title}</span>
        <span style={{
          padding: '4px 6px', borderRadius: 6, display: 'flex',
          background: accentColor ? `${accentColor}18` : `${A}18`,
          color: accentColor ?? A,
        }}>{d.icon}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <div style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 26, fontWeight: 600, letterSpacing: '-0.03em', color: accentColor ?? S.text, lineHeight: 1 }}>
            {d.value}
          </div>
          {d.delta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: 11.5, color: positive ? '#4ade80' : '#f87171', fontWeight: 500 }}>
              {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {d.delta}
            </div>
          )}
        </div>
        <Sparkline positive={positive} />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const barbershopId = user?.barbershopId ?? '';
  const firstName = user?.name?.split(' ')[0] ?? '';

  const [filterProfessionalId, setFilterProfessionalId] = useState('');
  const [filterBranchId, setFilterBranchId]             = useState('');
  const [filterMonths, setFilterMonths]                  = useState(6);

  const { data: kpis, isLoading } = useQuery({
    queryKey: ['kpis', barbershopId, filterProfessionalId, filterBranchId],
    queryFn: () => barbershopApi.kpis(barbershopId, {
      professionalId: filterProfessionalId || undefined,
      branchId: filterBranchId || undefined,
    }).then(r => r.data),
    enabled: !!barbershopId && !isSuperAdmin,
  });

  const { data: professionals } = useQuery({
    queryKey: ['professionals-list'],
    queryFn: () => barbershopApi.professionals().then(r => r.data),
    enabled: !!barbershopId && !isSuperAdmin && user?.role === 'ADMIN',
  });

  const { data: branches } = useQuery({
    queryKey: ['branches-list', barbershopId],
    queryFn: () => barbershopApi.branches(barbershopId).then(r => r.data),
    enabled: !!barbershopId && !isSuperAdmin && user?.role === 'ADMIN',
  });

  const isAdmin = user?.role === 'ADMIN';

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">SaaS Dashboard</h1>
        <div className="flex items-center justify-center py-20 bg-card border border-border rounded-xl">
          <p className="text-muted-foreground">Bem-vindo, {user?.name}. Métricas da plataforma em breve.</p>
        </div>
      </div>
    );
  }

  const kpiCards: KpiData[] = [
    {
      title: 'Faturamento Mensal',
      value: kpis ? `R$ ${(kpis.revenueMonth ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—',
      delta: '+22% vs mês anterior',
      positive: true,
      icon: <TrendingUp size={14} />,
    },
    {
      title: 'Cortes este Mês',
      value: String(kpis?.appointmentsMonth ?? '—'),
      delta: '+42 vs mês anterior',
      positive: true,
      icon: <Scissors size={14} />,
    },
    {
      title: 'Assinaturas Ativas',
      value: String(kpis?.activeSubscriptions ?? '—'),
      delta: `${kpis?.activeSubscriptions ?? 0} recorrentes`,
      positive: true,
      icon: <CreditCard size={14} />,
    },
    {
      title: 'Comandas Abertas',
      value: String(kpis?.openCommands ?? '—'),
      delta: kpis?.openCommands ? 'Em andamento' : 'Nenhuma aberta',
      positive: !(kpis?.openCommands),
      icon: <CalendarClock size={14} />,
      variant: (kpis?.openCommands ?? 0) > 0 ? 'warning' : 'default',
    },
  ];

  return (
    <>
    <style>{dashCss}</style>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, fontFamily: "'Inter', sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', margin: 0, color: S.text }}>
            Olá, {firstName}{' '}
            <span style={{ color: S.textMuted, fontStyle: 'italic', fontWeight: 400, fontSize: 22 }}>
              — sua barbearia está indo bem.
            </span>
          </h1>
          <p style={{ fontSize: 12.5, color: S.textMuted, marginTop: 4 }}>
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Filters */}
        {isAdmin && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <SlidersHorizontal size={14} style={{ color: S.textMuted, flexShrink: 0 }} />
            {professionals && professionals.length > 0 && (
              <select value={filterProfessionalId} onChange={e => setFilterProfessionalId(e.target.value)}
                style={{ height: 32, padding: '0 8px', fontSize: 12, background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, color: S.text, outline: 'none' }}>
                <option value="">Todos os barbeiros</option>
                {professionals.map(p => <option key={p.id} value={p.id}>{p.nickname ?? p.user.name}</option>)}
              </select>
            )}
            {branches && branches.length > 1 && (
              <select value={filterBranchId} onChange={e => setFilterBranchId(e.target.value)}
                style={{ height: 32, padding: '0 8px', fontSize: 12, background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, color: S.text, outline: 'none' }}>
                <option value="">Todas as filiais</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <select value={filterMonths} onChange={e => setFilterMonths(Number(e.target.value))}
              style={{ height: 32, padding: '0 8px', fontSize: 12, background: S.card, border: `1px solid ${S.border}`, borderRadius: 8, color: S.text, outline: 'none' }}>
              <option value={3}>3 meses</option>
              <option value={6}>6 meses</option>
              <option value={12}>12 meses</option>
            </select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', color: S.textMuted }} />
        </div>
      ) : (
        <>
          {/* ── KPI row ── */}
          <div className="dash-kpi-row">
            {kpiCards.map((d, i) => <KpiCard key={i} d={d} />)}
          </div>

          {/* ── Charts row ── */}
          <div className="dash-charts">
            <RevenueChart
              barbershopId={barbershopId}
              professionalId={filterProfessionalId || undefined}
              branchId={filterBranchId || undefined}
              months={filterMonths}
            />
            <AppointmentOriginChart
              barbershopId={barbershopId}
              professionalId={filterProfessionalId || undefined}
              branchId={filterBranchId || undefined}
            />
          </div>

          {/* ── Professionals + Inadimplentes ── */}
          {((professionals && professionals.length > 0) || (kpis?.defaulting ?? 0) > 0) && (
            <div className="dash-bottom">
              {/* Professional rankings */}
              {professionals && professionals.length > 0 && (
                <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: '18px 20px' }}>
                  <h3 style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: '0 0 14px' }}>Profissionais</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {professionals.slice(0, 5).map((p, i) => {
                      const name = p.nickname ?? p.user?.name ?? '—';
                      const initials = name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase();
                      return (
                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 11, color: S.textMuted, width: 16, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${A}20`, border: `1px solid ${A}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: A, flexShrink: 0 }}>
                            {initials}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 500, color: S.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inadimplentes + resumo */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: (kpis?.defaulting ?? 0) > 0 ? 'rgba(248,113,113,0.06)' : S.card, border: `1px solid ${(kpis?.defaulting ?? 0) > 0 ? 'rgba(248,113,113,0.2)' : S.border}`, borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Inadimplentes</span>
                    <AlertTriangle size={14} style={{ color: (kpis?.defaulting ?? 0) > 0 ? '#f87171' : S.textMuted }} />
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 32, fontWeight: 600, color: (kpis?.defaulting ?? 0) > 0 ? '#f87171' : S.text }}>
                    {kpis?.defaulting ?? '—'}
                  </div>
                  <div style={{ fontSize: 11.5, color: S.textMuted, marginTop: 4 }}>Assinaturas em atraso</div>
                </div>

                <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: S.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Profissionais Ativos</div>
                  <div style={{ fontFamily: "'Space Grotesk', 'Inter', sans-serif", fontSize: 32, fontWeight: 600, color: S.text }}>
                    {kpis?.professionals ?? '—'}
                  </div>
                  <div style={{ fontSize: 11.5, color: S.textMuted, marginTop: 4 }}>na sua barbearia</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
    </>
  );
}
