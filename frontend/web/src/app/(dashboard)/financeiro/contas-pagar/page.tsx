'use client';
import { TransactionPage } from '@/components/financeiro/transaction-page';
export default function ContasPagarPage() {
  return <TransactionPage type="EXPENSE" status="PENDING" title="Contas a pagar" description="Despesas pendentes e vencimentos futuros" />;
}
