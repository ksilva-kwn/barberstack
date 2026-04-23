-- AlterTable: add cnpj, email, managerName to barbershop_branches
ALTER TABLE "barbershop_branches" ADD COLUMN "cnpj"        TEXT;
ALTER TABLE "barbershop_branches" ADD COLUMN "email"       TEXT;
ALTER TABLE "barbershop_branches" ADD COLUMN "managerName" TEXT;

-- AlterTable: add allowMultiBranch to client_plans
ALTER TABLE "client_plans" ADD COLUMN "allowMultiBranch" BOOLEAN NOT NULL DEFAULT false;
