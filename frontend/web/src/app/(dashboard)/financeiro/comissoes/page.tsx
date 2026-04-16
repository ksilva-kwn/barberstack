'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, Users, ChevronDown, ChevronUp, Scissors } from 'lucide-react';
import { financialApi, CommissionReport } from '@/lib/financial.api';
import { cn } from '@/lib/utils';

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ComissoesPage() {
  const now = new Date();
  const [from, setFrom] = useState(format(startOfMonth(now), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(endOfMonth(now),   'yyyy-MM-dd'));
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: report = [], isLoading } = useQuery({
    queryKey: ['commissions-report', from, to],
    queryFn: () => financialApi.commissions({ from, to }).then(r => r.data),
  });

  const totalGross = report.reduce((s, r) => s + r.grossAmount, 0);
  const totalComm  = report.reduce((s, r) => s + r.commissionAmount, 0);
  const totalApts  = report.reduce((s, r) => s + r.totalServices, 0);

  const inputCls = 'px-3 py-1.5 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';

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

      {/* KPIs */}
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
              {/* Header do barbeiro */}
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

              {/* Detalhe dos atendimentos */}
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
