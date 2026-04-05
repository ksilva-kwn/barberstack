'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Nov', revenue: 3200 },
  { month: 'Dez', revenue: 4100 },
  { month: 'Jan', revenue: 3800 },
  { month: 'Fev', revenue: 4500 },
  { month: 'Mar', revenue: 4200 },
  { month: 'Abr', revenue: 4850 },
];

export function RevenueChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Faturamento Mensal</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(35, 100%, 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(35, 100%, 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(217.2, 32.6%, 20%)" />
          <XAxis dataKey="month" tick={{ fill: 'hsl(215, 20.2%, 65.1%)', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'hsl(215, 20.2%, 65.1%)', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(222.2, 47%, 11%)', border: '1px solid hsl(217.2, 32.6%, 17.5%)', borderRadius: 8 }}
            labelStyle={{ color: 'hsl(210, 40%, 98%)' }}
            formatter={(v: number) => [`R$ ${v.toFixed(2)}`, 'Faturamento']}
          />
          <Area type="monotone" dataKey="revenue" stroke="hsl(35, 100%, 50%)" strokeWidth={2} fill="url(#revenueGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
