'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Loader2, Users, ChevronDown, ChevronUp, Scissors,
  CreditCard, Settings2, Trophy, Equal, DollarSign,
} from 'lucide-react';
import { financialApi, CommissionReport, PlanCommissionModel } from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const MODEL_LABELS: Record<PlanCommissionModel, string> = {
  FIXED:        'Valor fixo por atendimento',
  PROPORTIONAL: 'Proporcional aos atendimentos',
  RANKING:      'Ranking (mais atendimentos = maior %)',
};

const MODEL_ICONS: Record<PlanCommissionModel, React.ReactNode> = {
  FIXED:        <DollarSign className="w-4 h-4" />,
  PROPORTIONAL: <Equal className="w-4 h-4" />,
  RANKING:      <Trophy className="w-4 h-4" />,
};

const inputCls = 'px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

// ─── Aba: Atendimentos Avulsos ────────────────────────────────────────────────

function TabAvulsos({ from, to }: { from: string; to: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: report = [], isLoading } = useQuery({
    queryKey: ['commissions-report', from, to],
    queryFn: () => financialApi.commissions({ from, to }).then(r => r.data),
  });

  const totalGross = report.reduce((s, r) => s + r.grossAmount, 0);
  const totalComm  = report.reduce((s, r) => s + r.commissionAmount, 0);
  const totalApts  = report.reduce((s, r) => s + r.totalServices, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Atendimentos', value: String(totalApts) },
          { label: 'Faturamento bruto', value: fmt(totalGross) },
          { label: 'Total de comissões', value: fmt(totalComm) },
        ].map(k => (
          <div key={k.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
            <p className="text-xl font-bold text-foreground">{k.value}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : report.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Users className="w-12 h-12 opacity-30 mb-4" />
          <p className="font-medium text-foreground">Nenhum atendimento pago no período</p>
          <p className="text-sm">Ajuste o intervalo de datas acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {report.map(pro => (
            <div key={pro.professionalId} className="bg-card border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setExpanded(e => e === pro.professionalId ? null : pro.professionalId)}
                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-accent/30 transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">{pro.name}</p>
                  <p className="text-xs text-muted-foreground">{pro.commissionRate}% de comissão</p>
                </div>
                <div className="flex items-center gap-6 shrink-0 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Atendimentos</p>
                    <p className="font-bold text-foreground">{pro.totalServices}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Bruto</p>
                    <p className="font-bold text-foreground">{fmt(pro.grossAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Comissão</p>
                    <p className="font-bold text-primary">{fmt(pro.commissionAmount)}</p>
                  </div>
                  {expanded === pro.professionalId
                    ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {expanded === pro.professionalId && (
                <div className="border-t border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-muted/20">
                        <th className="text-left px-5 py-2 text-xs font-medium text-muted-foreground">Data</th>
                        <th className="text-right px-5 py-2 text-xs font-medium text-muted-foreground">Valor serviço</th>
                        <th className="text-right px-5 py-2 text-xs font-medium text-muted-foreground">Comissão ({pro.commissionRate}%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {pro.appointments.map(apt => (
                        <tr key={apt.id} className="hover:bg-accent/10">
                          <td className="px-5 py-2 text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <Scissors className="w-3.5 h-3.5 shrink-0" />
                              {format(new Date(apt.scheduledAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </div>
                          </td>
                          <td className="px-5 py-2 text-right text-foreground">{fmt(apt.totalAmount)}</td>
                          <td className="px-5 py-2 text-right font-medium text-primary">{fmt(apt.commissionAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Aba: Comissões de Planos ─────────────────────────────────────────────────

function TabPlanos({ from, to }: { from: string; to: string }) {
  const qc = useQueryClient();
  const now = new Date();
  const [configOpen, setConfigOpen] = useState(false);
  const [draftModel, setDraftModel]       = useState<PlanCommissionModel>('PROPORTIONAL');
  const [draftFixed, setDraftFixed]       = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['plan-commissions', from, to],
    queryFn: () => financialApi.planCommissions({ from, to }).then(r => r.data),
  });

  const { data: config } = useQuery({
    queryKey: ['plan-commission-config'],
    queryFn: () => financialApi.planCommissionConfig().then(r => r.data),
    onSuccess: (d) => { setDraftModel(d.model); setDraftFixed(d.fixedValue?.toString() ?? ''); },
  });

  const saveConfig = useMutation({
    mutationFn: () => financialApi.updatePlanCommissionConfig({
      model: draftModel,
      fixedValue: draftModel === 'FIXED' ? parseFloat(draftFixed) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plan-commission-config'] });
      qc.invalidateQueries({ queryKey: ['plan-commissions'] });
      setConfigOpen(false);
    },
  });

  const markPaid = useMutation({
    mutationFn: (pro: { professionalId: string; name: string; totalSubscriptionServices: number; commissionAmount: number }) => {
      if (!report) throw new Error();
      return financialApi.markPlanCommissionPaid({
        professionalId: pro.professionalId,
        year:  now.getFullYear(),
        month: now.getMonth() + 1,
        model: report.model,
        totalSubscriptionServices: pro.totalSubscriptionServices,
        subscriptionRevenue: report.totalRevenue,
        commissionAmount: pro.commissionAmount,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plan-commission-payments'] }),
  });

  return (
    <div className="space-y-4">
      {/* Config banner */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {config ? MODEL_ICONS[config.model] : <Settings2 className="w-4 h-4" />}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">
              {config ? MODEL_LABELS[config.model] : '—'}
            </p>
            {config?.model === 'FIXED' && config.fixedValue && (
              <p className="text-xs text-muted-foreground">{fmt(config.fixedValue)} por atendimento</p>
            )}
          </div>
        </div>
        <button
          onClick={() => setConfigOpen(o => !o)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-accent/30 transition-colors text-muted-foreground"
        >
          <Settings2 className="w-3.5 h-3.5" /> Configurar
        </button>
      </div>

      {/* Config panel */}
      {configOpen && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <p className="text-sm font-semibold text-foreground">Modelo de comissão</p>
          <div className="space-y-2">
            {(['FIXED', 'PROPORTIONAL', 'RANKING'] as PlanCommissionModel[]).map(m => (
              <label key={m} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="planModel"
                  value={m}
                  checked={draftModel === m}
                  onChange={() => setDraftModel(m)}
                  className="accent-primary"
                />
                <div className="flex items-center gap-2 text-sm text-foreground">
                  <span className="text-muted-foreground">{MODEL_ICONS[m]}</span>
                  {MODEL_LABELS[m]}
                </div>
              </label>
            ))}
          </div>

          {draftModel === 'FIXED' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground whitespace-nowrap">Valor por atendimento (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftFixed}
                onChange={e => setDraftFixed(e.target.value)}
                className={cn(inputCls, 'w-32')}
                placeholder="0,00"
              />
            </div>
          )}

          {draftModel === 'RANKING' && (
            <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-3">
              1º lugar: 3× peso · 2º lugar: 2× peso · demais: 1× peso
              <br />A receita total de planos é distribuída proporcionalmente pelos pesos.
            </p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => saveConfig.mutate()}
              disabled={saveConfig.isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {saveConfig.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Salvar configuração
            </button>
            <button
              onClick={() => setConfigOpen(false)}
              className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-accent/30 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* KPIs */}
      {report && (
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Receita de planos no período', value: fmt(report.totalRevenue) },
            { label: 'Atendimentos de plano', value: String(report.totalSubscriptionServices) },
          ].map(k => (
            <div key={k.label} className="bg-card border border-border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{k.label}</p>
              <p className="text-xl font-bold text-foreground">{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !report || report.professionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <CreditCard className="w-12 h-12 opacity-30 mb-4" />
          <p className="font-medium text-foreground">Nenhum atendimento de plano no período</p>
          <p className="text-sm">Vincule agendamentos aos planos dos clientes para ver as comissões.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {report.professionals.map((pro, idx) => (
            <div key={pro.professionalId} className="bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4">
              {report.model === 'RANKING' && (
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  idx === 0 ? 'bg-yellow-400/20 text-yellow-500' :
                  idx === 1 ? 'bg-slate-400/20 text-slate-400' :
                  idx === 2 ? 'bg-amber-600/20 text-amber-600' :
                  'bg-muted/30 text-muted-foreground'
                )}>
                  {idx + 1}º
                </div>
              )}
              {report.model !== 'RANKING' && (
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground">{pro.name}</p>
                <p className="text-xs text-muted-foreground">{pro.totalSubscriptionServices} atend. de plano</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs text-muted-foreground">Comissão</p>
                <p className="font-bold text-primary text-lg">{fmt(pro.commissionAmount)}</p>
              </div>
              <button
                onClick={() => markPaid.mutate(pro)}
                disabled={markPaid.isPending}
                className="ml-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 text-xs font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                Marcar pago
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function ComissoesPage() {
  const now = new Date();
  const [from, setFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(endOfMonth(now),   'yyyy-MM-dd'));
  const [tab,  setTab]  = useState<'avulsos' | 'planos'>('avulsos');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
        <p className="text-muted-foreground text-sm">Cálculo de comissões por atendimento no período selecionado</p>
      </div>

      {/* Filtro de período */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
        <span className="text-muted-foreground text-sm">até</span>
        <input type="date" value={to}   onChange={e => setTo(e.target.value)}   className={inputCls} />
      </div>

      {/* Abas */}
      <div className="flex gap-1 p-1 bg-muted/30 rounded-xl w-fit">
        {([
          { key: 'avulsos', label: 'Atendimentos avulsos', icon: <Scissors className="w-3.5 h-3.5" /> },
          { key: 'planos',  label: 'Planos de assinatura',  icon: <CreditCard className="w-3.5 h-3.5" /> },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'avulsos' ? <TabAvulsos from={from} to={to} /> : <TabPlanos from={from} to={to} />}
    </div>
  );
}
