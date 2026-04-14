'use client';
import { TransactionPage } from '@/components/financeiro/transaction-page';
export default function ReceitasPage() {
  return <TransactionPage type="INCOME" title="Receitas" description="Registre entradas financeiras avulsas além das comandas" />;
}
