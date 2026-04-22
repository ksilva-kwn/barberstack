-- Add isFeatured to client_plans
ALTER TABLE "client_plans" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;

-- Add CANCELING value to ClientSubscriptionStatus enum
ALTER TYPE "ClientSubscriptionStatus" ADD VALUE IF NOT EXISTS 'CANCELING';
