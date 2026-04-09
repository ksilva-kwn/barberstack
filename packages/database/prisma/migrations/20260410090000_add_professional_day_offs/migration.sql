-- CreateTable
CREATE TABLE "professional_day_offs" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "professional_day_offs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "professional_day_offs_professionalId_date_key" ON "professional_day_offs"("professionalId", "date");

-- CreateIndex
CREATE INDEX "professional_day_offs_professionalId_idx" ON "professional_day_offs"("professionalId");

-- AddForeignKey
ALTER TABLE "professional_day_offs" ADD CONSTRAINT "professional_day_offs_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "professionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
