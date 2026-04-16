-- CreateTable
CREATE TABLE "barbershop_business_hours" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "openTime" TEXT NOT NULL DEFAULT '09:00',
    "closeTime" TEXT NOT NULL DEFAULT '18:00',

    CONSTRAINT "barbershop_business_hours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "barbershop_business_hours_barbershopId_dayOfWeek_key" ON "barbershop_business_hours"("barbershopId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "barbershop_business_hours_barbershopId_idx" ON "barbershop_business_hours"("barbershopId");

-- AddForeignKey
ALTER TABLE "barbershop_business_hours" ADD CONSTRAINT "barbershop_business_hours_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
