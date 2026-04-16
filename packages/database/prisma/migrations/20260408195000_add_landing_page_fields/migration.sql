-- AlterTable
ALTER TABLE "barbershops" ADD COLUMN IF NOT EXISTS "coverUrl" TEXT,
ADD COLUMN IF NOT EXISTS "description" TEXT;
