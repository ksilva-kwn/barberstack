'use client';

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

export function RevenueChart({ barbershopId, professionalId, branchId, months = 6 }: Props) {
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
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2, 32.6%, 20%)" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fill: 'hsl(215, 20.2%, 65.1%)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'hsl(215, 20.2%, 65.1%)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(217.2, 32.6%, 17.5%)', radius: 4 }}
              contentStyle={{
                backgroundColor: 'hsl(222.2, 47%, 11%)',
                border: '1px solid hsl(217.2, 32.6%, 17.5%)',
                borderRadius: 8,
              }}
              labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
              formatter={(v: number) => [
                `R$ ${(v ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                'Faturamento',
              ]}
            />
            <Bar dataKey="revenue" fill="hsl(35, 100%, 50%)" radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
