-- Add payment tracking fields to appointments
ALTER TABLE "appointments" ADD COLUMN "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING';
ALTER TABLE "appointments" ADD COLUMN "paymentMethod" TEXT;
ALTER TABLE "appointments" ADD COLUMN "paidAt" TIMESTAMP(3);
