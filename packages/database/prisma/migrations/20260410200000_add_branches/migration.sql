-- CreateTable: barbershop_branches
CREATE TABLE "barbershop_branches" (
  "id"           TEXT        NOT NULL,
  "barbershopId" TEXT        NOT NULL,
  "name"         TEXT        NOT NULL,
  "address"      TEXT,
  "phone"        TEXT,
  "city"         TEXT,
  "state"        TEXT,
  "zipCode"      TEXT,
  "isMain"       BOOLEAN     NOT NULL DEFAULT false,
  "isActive"     BOOLEAN     NOT NULL DEFAULT true,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "barbershop_branches_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "barbershop_branches_barbershopId_fkey"
    FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "barbershop_branches_barbershopId_idx" ON "barbershop_branches"("barbershopId");

-- Add branchId to professionals
ALTER TABLE "professionals" ADD COLUMN "branchId" TEXT;
ALTER TABLE "professionals"
  ADD CONSTRAINT "professionals_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "barbershop_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add branchId to appointments
ALTER TABLE "appointments" ADD COLUMN "branchId" TEXT;
ALTER TABLE "appointments"
  ADD CONSTRAINT "appointments_branchId_fkey"
  FOREIGN KEY ("branchId") REFERENCES "barbershop_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
