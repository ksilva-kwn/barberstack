'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Wallet, ArrowUpRight, Loader2, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { paymentApi } from '@/lib/payment.api';
import { barbershopApi } from '@/lib/barbershop.api';
import { useAuth } from '@/hooks/use-auth';

const fmt = (v: number) =>
  `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function formatCnpj(v: string) {
  const d = v.replace(/\D/g, '');
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export default function SaquePage() {
  const { user } = useAuth();
  const barbershopId = user?.barbershopId ?? '';
  const [value, setValue] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const { data: balanceData, isLoading: loadingBalance, refetch } = useQuery({
    queryKey: ['asaas-balance'],
    queryFn: () => paymentApi.balance().then(r => r.data),
    retry: false,
  });

  const { data: settings } = useQuery({
    queryKey: ['barbershop-settings', barbershopId],
    queryFn: () => barbershopApi.getSettings(barbershopId).then(r => r.data),
    enabled: !!barbershopId,
  });

  const transferMutation = useMutation({
    mutationFn: (v: number) => paymentApi.transfer(v, 'Saque Barberstack'),
    onSuccess: () => {
      setSuccess(true);
      setValue('');
      refetch();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error ?? 'Erro ao realizar saque');
    },
  });

  const balance = balanceData?.balance ?? 0;
  const configured = balanceData?.configured ?? false;
  const inputValue = parseFloat(value.replace(',', '.')) || 0;
  const canTransfer = configured && inputValue > 0 && inputValue <= balance && !transferMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!inputValue || inputValue <= 0) { setError('Informe um valor válido'); return; }
    if (inputValue > balance) { setError('Valor maior que o saldo disponível'); return; }
    transferMutation.mutate(inputValue);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Saque via PIX</h1>
        <p className="text-muted-foreground text-sm">Transfira seu saldo Asaas para o CNPJ da barbearia</p>
      </div>

      {loadingBalance ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !configured ? (
        <div className="flex items-start gap-3 p-5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-500">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Subconta Asaas não configurada</p>
            <p className="text-xs mt-1 opacity-80">
              A integração com o Asaas ainda não foi ativada para esta barbearia.
              Novos cadastros já criam a subconta automaticamente.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Saldo disponível */}
          <div className="bg-card border border-border rounded-xl p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Wallet className="w-7 h-7 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Saldo disponível (Asaas)</p>
              <p className="text-4xl font-bold text-foreground">{fmt(balance)}</p>
              <p className="text-xs text-muted-foreground mt-1">Atualizado agora</p>
            </div>
          </div>

          {/* Destino do saque */}
          <div className="bg-card border border-border rounded-xl p-5 flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Conta de destino</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Transferência via PIX • chave CNPJ cadastrado da barbearia
              </p>
              <p className="text-sm font-mono font-semibold text-primary mt-2">
                {settings?.document ? formatCnpj(settings.document) : '—'}
              </p>
              {settings?.name && (
                <p className="text-xs text-muted-foreground mt-0.5">{settings.name}</p>
              )}
            </div>
          </div>

          {/* Formulário de saque */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-foreground">Solicitar saque</h2>

            {success && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className="text-sm text-emerald-500 font-medium">
                  Saque solicitado com sucesso! O PIX será processado pelo Asaas em até 30 minutos.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Valor do saque (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium pointer-events-none">R$</span>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={balance}
                    value={value}
                    onChange={e => { setValue(e.target.value); setError(''); setSuccess(false); }}
                    placeholder="0,00"
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-input text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors"
                  />
                </div>
                {inputValue > 0 && inputValue <= balance && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Saldo após saque: <span className="font-medium text-foreground">{fmt(balance - inputValue)}</span>
                  </p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!canTransfer}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {transferMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                ) : (
                  <><ArrowUpRight className="w-4 h-4" /> Sacar via PIX</>
                )}
              </button>
            </form>

            <p className="text-xs text-muted-foreground text-center">
              O Asaas pode cobrar uma taxa de transferência. O PIX é processado em até 30 minutos.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
