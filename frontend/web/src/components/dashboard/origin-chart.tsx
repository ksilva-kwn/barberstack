'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { barbershopApi } from '@/lib/barbershop.api';
import { Loader2 } from 'lucide-react';

const COLORS = ['hsl(38, 65%, 52%)', 'hsl(217, 33%, 55%)'];

interface Props {
  barbershopId: string;
  professionalId?: string;
  branchId?: string;
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

export function AppointmentOriginChart({ barbershopId, professionalId, branchId }: Props) {
  const dark = useIsDark();

  const tooltipBg  = dark ? '#1e1e1e' : '#ffffff';
  const tooltipBdr = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)';
  const tooltipClr = dark ? '#f3f4f6' : '#111827';
  const legendClr  = dark ? '#9ca3af' : '#6b7280';

  const { data, isLoading } = useQuery({
    queryKey: ['origin-chart', barbershopId, professionalId, branchId],
    queryFn: () => barbershopApi.originChart(barbershopId, {
      professionalId: professionalId || undefined,
      branchId: branchId || undefined,
    }).then((r) => r.data),
    enabled: !!barbershopId,
  });

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Origem dos Agendamentos</h3>

      {isLoading && (
        <div className="flex items-center justify-center h-[220px]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="flex items-center justify-center h-[220px]">
          <p className="text-sm text-muted-foreground">Nenhum agendamento ainda</p>
        </div>
      )}

      {!isLoading && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                border: `1px solid ${tooltipBdr}`,
                borderRadius: 8,
                color: tooltipClr,
              }}
              formatter={(v: number) => [`${v} agendamentos`]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: legendClr }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
