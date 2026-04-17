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
        'relative rounded-2xl p-5 space-y-3 overflow-hidden transition-all duration-200',
        'border backdrop-blur-sm',
        'hover:-translate-y-0.5 hover:shadow-lg',
        variant === 'default' && 'bg-card/80 border-border hover:border-primary/30 hover:shadow-primary/10',
        variant === 'warning' && 'bg-yellow-500/5 border-yellow-500/25 hover:shadow-yellow-500/10',
        variant === 'danger'  && 'bg-destructive/5 border-destructive/25 hover:shadow-destructive/10',
      )}
    >
      {/* Subtle top gradient line */}
      <div
        className={cn(
          'absolute top-0 left-6 right-6 h-px rounded-full',
          variant === 'default' && 'bg-gradient-to-r from-transparent via-primary/40 to-transparent',
          variant === 'warning' && 'bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent',
          variant === 'danger'  && 'bg-gradient-to-r from-transparent via-destructive/40 to-transparent',
        )}
      />

      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <div
          className={cn(
            'p-2.5 rounded-xl',
            variant === 'default' && 'bg-primary/10 text-primary',
            variant === 'warning' && 'bg-yellow-500/10 text-yellow-500',
            variant === 'danger'  && 'bg-destructive/10 text-destructive',
          )}
        >
          {icon}
        </div>
      </div>

      <div>
        <p className={cn(
          'text-3xl font-bold tracking-tight font-display',
          variant === 'default' && 'text-foreground',
          variant === 'warning' && 'text-yellow-500',
          variant === 'danger'  && 'text-destructive',
        )}>
          {value}
        </p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>

      {trend && (
        <div className={cn('flex items-center gap-1.5 text-xs font-semibold', trend.positive ? 'text-emerald-500' : 'text-red-500')}>
          {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          <span>{trend.positive ? '+' : '-'}{trend.value}% vs mês anterior</span>
        </div>
      )}
    </div>
  );
}
