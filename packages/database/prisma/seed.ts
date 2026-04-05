import { PrismaClient, UserRole, SaasPlan } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Super Admin (SaaS owner)
  const superAdminPassword = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@barberstack.app' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@barberstack.app',
      passwordHash: superAdminPassword,
      role: UserRole.SUPER_ADMIN,
    },
  });

  // Demo Barbershop
  const demoBarbershop = await prisma.barbershop.upsert({
    where: { slug: 'barbearia-demo' },
    update: {},
    create: {
      name: 'Barbearia Demo',
      slug: 'barbearia-demo',
      document: '00.000.000/0001-00',
      phone: '(11) 99999-9999',
      email: 'demo@barbearia.com',
      city: 'São Paulo',
      state: 'SP',
      saasPlan: SaasPlan.GOLD,
    },
  });

  // Demo Admin (dono da barbearia)
  const adminPassword = await bcrypt.hash('demo123', 12);
  const adminUser = await prisma.user.upsert({
    where: { email: 'dono@barbearia.com' },
    update: {},
    create: {
      name: 'João Silva',
      email: 'dono@barbearia.com',
      phone: '(11) 91111-1111',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
      barbershopId: demoBarbershop.id,
    },
  });

  // Demo Barber
  const barberPassword = await bcrypt.hash('demo123', 12);
  const barberUser = await prisma.user.upsert({
    where: { email: 'barbeiro@barbearia.com' },
    update: {},
    create: {
      name: 'Carlos Mendes',
      email: 'barbeiro@barbearia.com',
      phone: '(11) 92222-2222',
      passwordHash: barberPassword,
      role: UserRole.BARBER,
      barbershopId: demoBarbershop.id,
    },
  });

  // Professional profile
  await prisma.professional.upsert({
    where: { userId: barberUser.id },
    update: {},
    create: {
      barbershopId: demoBarbershop.id,
      userId: barberUser.id,
      nickname: 'Carlos',
      commissionRate: 40,
    },
  });

  // Services
  const services = [
    { name: 'Corte Social', price: 35, durationMins: 30 },
    { name: 'Corte + Barba', price: 55, durationMins: 50 },
    { name: 'Barba', price: 25, durationMins: 25 },
    { name: 'Pigmentação', price: 80, durationMins: 60 },
  ];

  for (const svc of services) {
    await prisma.service.create({
      data: {
        ...svc,
        barbershopId: demoBarbershop.id,
      },
    });
  }

  console.log('✅ Seed concluído!');
  console.log('   Super Admin: admin@barberstack.app / admin123');
  console.log('   Dono:        dono@barbearia.com / demo123');
  console.log('   Barbeiro:    barbeiro@barbearia.com / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
