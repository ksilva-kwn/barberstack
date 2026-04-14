-- Adiciona campos que faltam em financial_transactions para o módulo financeiro manual
ALTER TABLE "financial_transactions"
  ADD COLUMN IF NOT EXISTS "category"  TEXT NOT NULL DEFAULT 'Geral',
  ADD COLUMN IF NOT EXISTS "title"     TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS "status"    TEXT NOT NULL DEFAULT 'PAID',
  ADD COLUMN IF NOT EXISTS "dueDate"   TIMESTAMP(3);

-- Garante defaults nas colunas obrigatórias (para entradas manuais sem Asaas)
ALTER TABLE "financial_transactions"
  ALTER COLUMN "grossAmount" SET DEFAULT 0,
  ALTER COLUMN "netAmount"   SET DEFAULT 0,
  ALTER COLUMN "feeAmount"   SET DEFAULT 0;
