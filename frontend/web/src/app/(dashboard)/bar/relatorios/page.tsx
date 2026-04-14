'use client';

import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/product.api';
import {
  ShoppingCart, TrendingUp, DollarSign, BarChart2,
  Package, AlertTriangle, Loader2, Star, Skull,
} from 'lucide-react';

function KpiCard({ icon, label, value, sub, color = 'default' }: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  color?: 'default' | 'green' | 'amber' | 'red' | 'blue';
}) {
  const colorMap = {
    default: 'bg-primary/10 text-primary',
    green:   'bg-emerald-500/10 text-emerald-400',
    amber:   'bg-amber-500/10 text-amber-400',
    red:     'bg-destructive/10 text-destructive',
    blue:    'bg-sky-500/10 text-sky-400',
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function HBar({ label, value, max, suffix = '', rank }: {
  label: string; value: number; max: number; suffix?: string; rank?: number;
}) {
  const rankColors = ['text-yellow-400', 'text-slate-400', 'text-amber-600'];
  return (
    <div className="flex items-center gap-3">
      {rank !== undefined && (
        <span className={`text-xs font-bold w-5 text-center shrink-0 ${rank < 3 ? rankColors[rank] : 'text-muted-foreground'}`}>
          {rank + 1}
        </span>
      )}
      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500/60 rounded-full transition-all duration-500"
          style={{ width: max > 0 ? `${Math.min((value / max) * 100, 100)}%` : '0%' }}
        />
      </div>
      <span className="text-xs text-foreground font-medium w-24 text-right shrink-0">{suffix}</span>
    </div>
  );
}

export default function BarRelatoriosPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['product-stats', 'BAR'],
    queryFn: () => productApi.stats('BAR').then(r => r.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (!stats) return null;

  const maxQty     = Math.max(...stats.topSold.map(p => p.totalQty), 1);
  const maxRevenue = Math.max(...stats.topSold.map(p => p.totalRevenue), 1);
  const maxMargin  = Math.max(...stats.topByMargin.map(p => p.margin), 1);
  const maxMonthRev = Math.max(...stats.revenueByMonth.map(m => m.revenue), 1);

  const ticketMedio = stats.totalQtySold > 0
    ? stats.totalRevenue / stats.totalQtySold
    : 0;

  const bestMonth = stats.revenueByMonth.length > 0
    ? stats.revenueByMonth.reduce((best, m) => m.revenue > best.revenue ? m : best)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatório do Bar</h1>
        <p className="text-muted-foreground text-sm">Consumo, faturamento e rentabilidade dos itens do bar</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={<Package className="w-4 h-4" />}
          label="Itens no cardápio"
          value={stats.totalProducts}
          color="default"
        />
        <KpiCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Faturamento total"
          value={`R$ ${stats.totalRevenue.toFixed(2).replace('.', ',')}`}
          sub={`${stats.totalQtySold} itens vendidos`}
          color="green"
        />
        <KpiCard
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Ticket médio / item"
          value={`R$ ${ticketMedio.toFixed(2).replace('.', ',')}`}
          sub="por unidade vendida"
          color="blue"
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Lucro potencial"
          value={`R$ ${stats.potentialProfit.toFixed(2).replace('.', ',')}`}
          sub="no estoque atual"
          color="amber"
        />
      </div>

      {/* Insight banner */}
      {bestMonth && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-400 text-sm">
          <Star className="w-4 h-4 shrink-0" />
          <p>
            Melhor mês: <span className="font-semibold">{bestMonth.month}</span> com{' '}
            <span className="font-semibold">R$ {Number(bestMonth.revenue).toFixed(2).replace('.', ',')}</span>{' '}
            em {bestMonth.qty} itens vendidos.
          </p>
        </div>
      )}

      {/* Alertas de estoque */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${stats.outOfStockCount > 0 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-card border-border text-muted-foreground'}`}>
          <Package className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-semibold">{stats.outOfStockCount} sem estoque</p>
            <p className="text-xs opacity-70">indisponíveis para venda</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${stats.lowStockCount > 0 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-card border-border text-muted-foreground'}`}>
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-semibold">{stats.lowStockCount} estoque baixo</p>
            <p className="text-xs opacity-70">abaixo do mínimo definido</p>
          </div>
        </div>
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${stats.deadStockCount > 0 ? 'bg-muted/50 border-border text-muted-foreground' : 'bg-card border-border text-muted-foreground'}`}>
          <Skull className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-semibold">{stats.deadStockCount} sem giro</p>
            <p className="text-xs opacity-70">nunca pedidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Itens mais pedidos (por quantidade) */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Itens mais pedidos</h2>
          </div>
          {stats.topSold.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topSold.map((p, i) => (
                <HBar
                  key={p.productId}
                  label={p.productName}
                  value={p.totalQty}
                  max={maxQty}
                  suffix={`${p.totalQty} un`}
                  rank={i}
                />
              ))}
            </div>
          )}
        </div>

        {/* Itens que mais faturam */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Itens que mais faturam</h2>
          </div>
          {stats.topSold.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {[...stats.topSold]
                .sort((a, b) => Number(b.totalRevenue) - Number(a.totalRevenue))
                .slice(0, 10)
                .map((p, i) => (
                  <HBar
                    key={p.productId}
                    label={p.productName}
                    value={Number(p.totalRevenue)}
                    max={maxRevenue}
                    suffix={`R$ ${Number(p.totalRevenue).toFixed(0)}`}
                    rank={i}
                  />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Maior margem de lucro */}
      <div className="bg-card border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-semibold text-foreground text-sm">Maior margem de lucro</h2>
          <span className="text-xs text-muted-foreground ml-auto">considere promover estes itens</span>
        </div>
        {stats.topByMargin.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda registrada ainda.</p>
        ) : (
          <div className="space-y-2.5">
            {stats.topByMargin.map((p, i) => (
              <HBar
                key={p.productId}
                label={p.productName}
                value={p.margin}
                max={maxMargin}
                suffix={`${p.marginPct.toFixed(0)}% · R$ ${p.margin.toFixed(0)}`}
                rank={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Faturamento por mês */}
      {stats.revenueByMonth.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Faturamento do bar por mês</h2>
          </div>
          <div className="space-y-2.5">
            {stats.revenueByMonth.map(m => (
              <HBar
                key={m.month}
                label={m.month}
                value={m.revenue}
                max={maxMonthRev}
                suffix={`${m.qty} un · R$ ${Number(m.revenue).toFixed(2).replace('.', ',')}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lista de reposição */}
      {(stats.lowStockProducts.length > 0 || stats.outOfStockCount > 0) && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-foreground text-sm">Itens para repor</h2>
          </div>
          <div className="divide-y divide-border">
            {stats.lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <div className="text-right">
                  <p className="text-sm font-bold text-amber-400">{p.stock} {p.unit}</p>
                  <p className="text-xs text-muted-foreground">mín: {p.minStockAlert}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Itens parados */}
      {stats.deadStock.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Skull className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Itens parados — nunca pedidos</h2>
            <span className="text-xs text-muted-foreground ml-auto">considere remover do cardápio</span>
          </div>
          <div className="divide-y divide-border">
            {stats.deadStock.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <p className="text-sm text-muted-foreground">{p.name}</p>
                <p className="text-sm font-medium text-foreground">{p.stock} {p.unit}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
