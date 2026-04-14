'use client';
import { TransactionPage } from '@/components/financeiro/transaction-page';
export default function ContasReceberPage() {
  return <TransactionPage type="INCOME" status="PENDING" title="Contas a receber" description="Receitas pendentes de recebimento" />;
}
