'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CheckCircle, Zap, Users } from 'lucide-react';
import { financialApi } from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ComissoesPage() {
  const qc = useQueryClient();
  const now = new Date();
  const [from, setFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(endOfMonth(now),   'yyyy-MM-dd'));
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['commissions', from, to, filter],
    queryFn: () => financialApi.commissions({
      from, to,
      ...(filter === 'paid'    ? { isPaid: true }  : {}),
      ...(filter === 'pending' ? { isPaid: false }  : {}),
    }).then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => financialApi.generateCommissions(from, to),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['commissions'] });
      alert(`${r.data.generated} comissão(ões) gerada(s).`);
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => financialApi.payCommission(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['commissions'] }),
  });

  const totalPending = commissions.filter(c => !c.isPaid).reduce((s, c) => s + Number(c.commissionAmount), 0);
  const totalPaid    = commissions.filter(c =>  c.isPaid).reduce((s, c) => s + Number(c.commissionAmount), 0);

  // Agrupado por barbeiro
  const byPro = commissions.reduce<Record<string, { name: string; count: number; totalGross: number; totalComm: number; pending: number }>>((acc, c) => {
    const id   = c.professionalId;
    const name = c.professional.nickname ?? c.professional.user.name;
    if (!acc[id]) acc[id] = { name, count: 0, totalGross: 0, totalComm: 0, pending: 0 };
    acc[id].count++;
    acc[id].totalGross += Number(c.grossAmount);
    acc[id].totalComm  += Number(c.commissionAmount);
    if (!c.isPaid) acc[id].pending += Number(c.commissionAmount);
    return acc;
  }, {});

  const inputCls = 'px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comissões</h1>
          <p className="text-muted-foreground text-sm">Comissões dos barbeiros por atendimento</p>
        </div>
        <button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Gerar comissões
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={inputCls} />
        <span className="text-muted-foreground text-sm">até</span>
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className={inputCls} />
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1 ml-auto">
          {([['all','Todas'],['pending','A pagar'],['paid','Pagas']] as [string,string][]).map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v as any)}
              className={cn('px-3 py-1 text-xs font-medium rounded transition-colors',
                filter === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">A pagar</p>
          <p className="text-2xl font-bold text-amber-400">{fmt(totalPending)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Pago</p>
          <p className="text-2xl font-bold text-emerald-400">{fmt(totalPaid)}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground mb-1">Atendimentos</p>
          <p className="text-2xl font-bold text-foreground">{commissions.length}</p>
        </div>
      </div>

      {/* Resumo por barbeiro */}
      {Object.keys(byPro).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Resumo por barbeiro</h2>
          </div>
          <div className="space-y-3">
            {Object.values(byPro).sort((a, b) => b.totalComm - a.totalComm).map(pro => (
              <div key={pro.name} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-foreground">{pro.name}</p>
                  <p className="text-xs text-muted-foreground">{pro.count} atendimento(s) · bruto {fmt(pro.totalGross)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{fmt(pro.totalComm)}</p>
                  {pro.pending > 0 && <p className="text-xs text-amber-400">A pagar: {fmt(pro.pending)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabela detalhada */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : commissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-muted-foreground">
            <p className="text-sm">Nenhuma comissão no período.</p>
            <p className="text-xs opacity-70">Clique em "Gerar comissões" para processar os atendimentos pagos.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Barbeiro</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Atendimento</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Bruto</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">% Comissão</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Valor</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {commissions.map((c, i) => (
                <tr key={c.id} className={cn('border-b border-border/50 last:border-0', i % 2 !== 0 && 'bg-muted/10')}>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {c.professional.nickname ?? c.professional.user.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {c.appointment.paidAt
                      ? format(new Date(c.appointment.paidAt), 'dd/MM/yy HH:mm', { locale: ptBR })
                      : format(new Date(c.appointment.scheduledAt), 'dd/MM/yy', { locale: ptBR })}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{fmt(c.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{Number(c.commissionRate).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-right font-semibold text-foreground">{fmt(c.commissionAmount)}</td>
                  <td className="px-4 py-3">
                    {c.isPaid ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400">
                        <CheckCircle className="w-3 h-3" /> Paga
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-amber-400">Pendente</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {!c.isPaid && (
                      <button
                        onClick={() => payMutation.mutate(c.id)}
                        disabled={payMutation.isPending}
                        title="Marcar como paga"
                        className="p-1.5 rounded text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
