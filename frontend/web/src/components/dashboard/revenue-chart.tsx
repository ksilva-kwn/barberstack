'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { barbershopApi } from '@/lib/barbershop.api';
import { Loader2 } from 'lucide-react';

interface Props {
  barbershopId: string;
  professionalId?: string;
  branchId?: string;
  months?: number;
}

function useIsDark() {
  const [dark, setDark] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark')),
    );
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function RevenueChart({ barbershopId, professionalId, branchId, months = 6 }: Props) {
  const dark = useIsDark();

  const grid        = dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const tick        = dark ? '#6b7280' : '#9ca3af';
  const cursor      = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
  const tooltipBg   = dark ? '#1e1e1e' : '#ffffff';
  const tooltipBdr  = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const tooltipClr  = dark ? '#f3f4f6' : '#111827';
  const barColor    = 'hsl(38, 65%, 52%)';

  const { data, isLoading } = useQuery({
    queryKey: ['revenue-chart', barbershopId, professionalId, branchId, months],
    queryFn: () => barbershopApi.revenueChart(barbershopId, {
      professionalId: professionalId || undefined,
      branchId: branchId || undefined,
      months,
    }).then((r) => r.data),
    enabled: !!barbershopId,
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento Mensal</h3>

      {isLoading && (
        <div className="flex items-center justify-center h-[220px]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && data && (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: tick, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: tick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: cursor, radius: 4 }}
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBdr}`,
                borderRadius: 8,
              }}
              labelStyle={{ color: tooltipClr }}
              formatter={(v: number) => [
                `R$ ${(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'Faturamento',
              ]}
            />
            <Bar dataKey="revenue" fill={barColor} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
