'use client';

import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { barbershopApi } from '@/lib/barbershop.api';
import { Loader2 } from 'lucide-react';

const COLORS = ['hsl(35, 100%, 50%)', 'hsl(217.2, 32.6%, 40%)'];

interface Props {
  barbershopId: string;
  professionalId?: string;
  branchId?: string;
}

export function AppointmentOriginChart({ barbershopId, professionalId, branchId }: Props) {
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
              contentStyle={{ backgroundColor: 'hsl(222.2, 47%, 11%)', border: '1px solid hsl(217.2, 32.6%, 17.5%)', borderRadius: 8 }}
              formatter={(v: number) => [`${v} agendamentos`]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: 'hsl(215, 20.2%, 65.1%)' }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
