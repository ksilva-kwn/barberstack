-- Add isFeatured to client_plans
ALTER TABLE "client_plans" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Add new values to ClientSubscriptionStatus enum
ALTER TYPE "ClientSubscriptionStatus" ADD VALUE IF NOT EXISTS 'CANCELING';
ALTER TYPE "ClientSubscriptionStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
