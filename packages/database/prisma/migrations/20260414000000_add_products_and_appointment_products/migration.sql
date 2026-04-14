-- Add type column to products (ESTOQUE | BAR)
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'ESTOQUE';

-- Create appointment_products table
CREATE TABLE IF NOT EXISTS "appointment_products" (
  "id"            TEXT        NOT NULL,
  "appointmentId" TEXT        NOT NULL,
  "productId"     TEXT        NOT NULL,
  "quantity"      INTEGER     NOT NULL DEFAULT 1,
  "price"         DECIMAL(10,2) NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "appointment_products_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "appointment_products_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "appointment_products_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "appointment_products_appointmentId_idx" ON "appointment_products"("appointmentId");
