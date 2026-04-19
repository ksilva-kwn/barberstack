-- Fix FK cascade on service junction tables so that deleting a Service
-- (via barbershop cascade) doesn't violate foreign key constraints.

-- appointment_services
ALTER TABLE "appointment_services"
  DROP CONSTRAINT IF EXISTS "appointment_services_serviceId_fkey";

ALTER TABLE "appointment_services"
  ADD CONSTRAINT "appointment_services_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- professional_services
ALTER TABLE "professional_services"
  DROP CONSTRAINT IF EXISTS "professional_services_serviceId_fkey";

ALTER TABLE "professional_services"
  ADD CONSTRAINT "professional_services_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- client_plan_services
ALTER TABLE "client_plan_services"
  DROP CONSTRAINT IF EXISTS "client_plan_services_serviceId_fkey";

ALTER TABLE "client_plan_services"
  ADD CONSTRAINT "client_plan_services_serviceId_fkey"
  FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
