'use client';
import { TransactionPage } from '@/components/financeiro/transaction-page';
export default function DespesasPage() {
  return <TransactionPage type="EXPENSE" title="Despesas" description="Registre e acompanhe todas as saídas financeiras da barbearia" />;
}
