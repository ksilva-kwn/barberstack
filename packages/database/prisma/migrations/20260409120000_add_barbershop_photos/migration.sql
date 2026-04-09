-- CreateTable
CREATE TABLE "barbershop_photos" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "barbershop_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "barbershop_photos_barbershopId_idx" ON "barbershop_photos"("barbershopId");

-- AddForeignKey
ALTER TABLE "barbershop_photos" ADD CONSTRAINT "barbershop_photos_barbershopId_fkey" FOREIGN KEY ("barbershopId") REFERENCES "barbershops"("id") ON DELETE CASCADE ON UPDATE CASCADE;
