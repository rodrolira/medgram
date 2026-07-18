import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: 'doctor@medgram.local' },
    update: {},
    create: {
      email: 'doctor@medgram.local',
      name: 'Dr. Aprobador',
      role: 'doctor_approver',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@medgram.local' },
    update: {},
    create: {
      email: 'admin@medgram.local',
      name: 'Agencia Admin',
      role: 'agency_admin',
    },
  });

  console.log('Seed OK: doctor@medgram.local (doctor_approver), admin@medgram.local (agency_admin)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
