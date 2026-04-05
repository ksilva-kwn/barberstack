import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: { value: number; positive: boolean };
  variant?: 'default' | 'warning' | 'danger';
}

export function KpiCard({ title, value, icon, description, trend, variant = 'default' }: KpiCardProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-5 space-y-3',
        variant === 'warning' && 'border-yellow-500/30 bg-yellow-500/5',
        variant === 'danger' && 'border-destructive/30 bg-destructive/5',
        variant === 'default' && 'border-border',
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <div
          className={cn(
            'p-2 rounded-lg',
            variant === 'default' && 'bg-primary/10 text-primary',
            variant === 'warning' && 'bg-yellow-500/10 text-yellow-500',
            variant === 'danger' && 'bg-destructive/10 text-destructive',
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>

      {trend && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', trend.positive ? 'text-green-500' : 'text-red-500')}>
          {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trend.positive ? '+' : '-'}{trend.value}% vs mês anterior</span>
        </div>
      )}
    </div>
  );
}
