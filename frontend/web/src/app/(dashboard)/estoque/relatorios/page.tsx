'use client';

import { useQuery } from '@tanstack/react-query';
import { productApi } from '@/lib/product.api';
import {
  Package, TrendingUp, TrendingDown, AlertTriangle, Loader2,
  DollarSign, BarChart2, ShoppingCart, Skull,
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

function HBar({ label, value, max, suffix = '' }: { label: string; value: number; max: number; suffix?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground w-28 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-5 bg-muted/30 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary/70 rounded-full transition-all duration-500"
          style={{ width: max > 0 ? `${Math.min((value / max) * 100, 100)}%` : '0%' }}
        />
      </div>
      <span className="text-xs text-foreground font-medium w-20 text-right shrink-0">{suffix}</span>
    </div>
  );
}

export default function EstoqueRelatoriosPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['product-stats', 'ESTOQUE'],
    queryFn: () => productApi.stats('ESTOQUE').then(r => r.data),
  });

  if (isLoading) return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
  if (!stats) return null;

  const maxQty = Math.max(...stats.topSold.map(p => p.totalQty), 1);
  const maxMargin = Math.max(...stats.topByMargin.map(p => p.margin), 1);
  const maxMonthRev = Math.max(...stats.revenueByMonth.map(m => m.revenue), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Relatório de Estoque</h1>
        <p className="text-muted-foreground text-sm">Análise de consumo, reposição e rentabilidade dos produtos</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<Package className="w-4 h-4" />} label="Produtos ativos" value={stats.totalProducts} color="default" />
        <KpiCard
          icon={<DollarSign className="w-4 h-4" />}
          label="Valor em estoque"
          value={`R$ ${stats.totalStockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="preço de venda"
          color="blue"
        />
        <KpiCard
          icon={<TrendingUp className="w-4 h-4" />}
          label="Lucro potencial"
          value={`R$ ${stats.potentialProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub="se vender tudo"
          color="green"
        />
        <KpiCard
          icon={<ShoppingCart className="w-4 h-4" />}
          label="Total vendido"
          value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          sub={`${stats.totalQtySold} unidades`}
          color="green"
        />
      </div>

      {/* Alertas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${stats.outOfStockCount > 0 ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-card border-border text-muted-foreground'}`}>
          <TrendingDown className="w-4 h-4 shrink-0" />
          <div>
            <p className="font-semibold">{stats.outOfStockCount} sem estoque</p>
            <p className="text-xs opacity-70">precisam de reposição urgente</p>
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
            <p className="text-xs opacity-70">nunca foram vendidos</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos mais consumidos */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Produtos mais consumidos</h2>
          </div>
          {stats.topSold.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topSold.map(p => (
                <HBar
                  key={p.productId}
                  label={p.productName}
                  value={p.totalQty}
                  max={maxQty}
                  suffix={`${p.totalQty} un · R$ ${Number(p.totalRevenue).toFixed(0)}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Maior margem de lucro */}
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Maior margem de lucro</h2>
          </div>
          {stats.topByMargin.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma venda registrada ainda.</p>
          ) : (
            <div className="space-y-2.5">
              {stats.topByMargin.map(p => (
                <HBar
                  key={p.productId}
                  label={p.productName}
                  value={p.margin}
                  max={maxMargin}
                  suffix={`${p.marginPct.toFixed(0)}% · R$ ${p.margin.toFixed(0)}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receita por mês */}
      {stats.revenueByMonth.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Receita de produtos por mês</h2>
          </div>
          <div className="space-y-2.5">
            {stats.revenueByMonth.map(m => (
              <HBar
                key={m.month}
                label={m.month}
                value={m.revenue}
                max={maxMonthRev}
                suffix={`${m.qty} un · R$ ${Number(m.revenue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Produtos para repor */}
      {(stats.lowStockProducts.length > 0 || stats.outOfStockCount > 0) && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h2 className="font-semibold text-foreground text-sm">Lista de reposição</h2>
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

      {/* Estoque parado */}
      {stats.deadStock.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Skull className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-foreground text-sm">Estoque parado — nunca vendido</h2>
            <span className="text-xs text-muted-foreground ml-auto">considere promoção ou descarte</span>
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
