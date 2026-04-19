-- AlterTable: adiciona campos financeiros à barbearia para criação da subconta Asaas
ALTER TABLE "barbershops" ADD COLUMN "companyType" TEXT;
ALTER TABLE "barbershops" ADD COLUMN "incomeValue" DECIMAL(10,2);
