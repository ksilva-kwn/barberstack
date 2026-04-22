-- Add isFeatured to client_plans
ALTER TABLE "client_plans" ADD COLUMN IF NOT EXISTS "isFeatured" BOOLEAN NOT NULL DEFAULT false;
