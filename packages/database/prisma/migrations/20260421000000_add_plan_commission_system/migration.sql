-- Plan commission config on barbershops
ALTER TABLE "barbershops"
  ADD COLUMN IF NOT EXISTS "planCommissionModel"      TEXT    NOT NULL DEFAULT 'PROPORTIONAL',
  ADD COLUMN IF NOT EXISTS "planCommissionFixedValue" DECIMAL(10,2);

-- Link appointment to client subscription
ALTER TABLE "appointments"
  ADD COLUMN IF NOT EXISTS "clientSubscriptionId" TEXT;

ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_clientSubscriptionId_fkey"
  FOREIGN KEY ("clientSubscriptionId") REFERENCES "client_subscriptions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX IF NOT EXISTS "appointments_clientSubscriptionId_idx"
  ON "appointments"("clientSubscriptionId");

-- Plan commission payments table
CREATE TABLE IF NOT EXISTS "plan_commission_payments" (
  "id"                        TEXT        NOT NULL,
  "barbershopId"              TEXT        NOT NULL,
  "professionalId"            TEXT        NOT NULL,
  "year"                      INTEGER     NOT NULL,
  "month"                     INTEGER     NOT NULL,
  "model"                     TEXT        NOT NULL,
  "totalSubscriptionServices" INTEGER     NOT NULL DEFAULT 0,
  "subscriptionRevenue"       DECIMAL(10,2) NOT NULL DEFAULT 0,
  "commissionAmount"          DECIMAL(10,2) NOT NULL,
  "isPaid"                    BOOLEAN     NOT NULL DEFAULT false,
  "paidAt"                    TIMESTAMP(3),
  "notes"                     TEXT,
  "createdAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "plan_commission_payments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "plan_commission_payments_barbershopId_fkey"
    FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "plan_commission_payments_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "plan_commission_payments_barbershopId_professionalId_year_month_key"
    UNIQUE ("barbershopId", "professionalId", "year", "month")
);

CREATE INDEX IF NOT EXISTS "plan_commission_payments_barbershopId_idx"
  ON "plan_commission_payments"("barbershopId");

CREATE INDEX IF NOT EXISTS "plan_commission_payments_professionalId_idx"
  ON "plan_commission_payments"("professionalId");
