'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { name: 'App / Online', value: 28 },
  { name: 'Recepção', value: 19 },
];

const COLORS = ['hsl(35, 100%, 50%)', 'hsl(217.2, 32.6%, 40%)'];

export function AppointmentOriginChart() {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Origem dos Agendamentos</h3>
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
    </div>
  );
}
