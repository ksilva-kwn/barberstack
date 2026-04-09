-- AlterTable: add optional time range to day-offs
ALTER TABLE "professional_day_offs" ADD COLUMN IF NOT EXISTS "startTime" TEXT;
ALTER TABLE "professional_day_offs" ADD COLUMN IF NOT EXISTS "endTime" TEXT;

-- CreateTable: recurring blocks
CREATE TABLE "professional_recurring_blocks" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_recurring_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "professional_recurring_blocks_professionalId_idx" ON "professional_recurring_blocks"("professionalId");

-- AddForeignKey
ALTER TABLE "professional_recurring_blocks" ADD CONSTRAINT "professional_recurring_blocks_professionalId_fkey"
    FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
