// CivicConnect - Prisma Seed Script
// Inserts the 5 initial categories idempotently using upsert.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialCategories = [
  {
    name: 'Potholes',
    description: 'Road potholes, surface cracks, asphalt damage, and pavement cave-ins.',
  },
  {
    name: 'Garbage Accumulation',
    description: 'Uncollected refuse, overflowing municipal bins, and illegal waste dumping.',
  },
  {
    name: 'Broken Streetlights',
    description: 'Faulty fixtures, flickering lights, dark stretches, and exposed wiring.',
  },
  {
    name: 'Water Leakage',
    description: 'Main pipeline bursts, leaking public hydrants, and drinking water wastage.',
  },
  {
    name: 'Drainage Issues',
    description: 'Clogged stormwater culverts, open manholes, and sewage backflow.',
  },
];

async function main() {
  console.log('--- Starting CivicConnect Category Seeding ---');

  for (const category of initialCategories) {
    const record = await prisma.category.upsert({
      where: { name: category.name },
      update: {
        description: category.description,
      },
      create: {
        name: category.name,
        description: category.description,
      },
    });
    console.log(`✓ Seeded category [ID: ${record.id}]: ${record.name}`);
  }

  // Also seed a default demo citizen and administrator if none exist
  const citizen = await prisma.user.upsert({
    where: { email: 'priya.sharma@civicmail.in' },
    update: {},
    create: {
      name: 'Priya Sharma',
      email: 'priya.sharma@civicmail.in',
      role: 'CITIZEN',
    },
  });
  console.log(`✓ Demo Citizen verified [ID: ${citizen.id}]: ${citizen.name}`);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@municipality.gov.in' },
    update: {},
    create: {
      name: 'Municipal Administrator',
      email: 'admin@municipality.gov.in',
      role: 'ADMIN',
    },
  });
  console.log(`✓ Demo Administrator verified [ID: ${admin.id}]: ${admin.name}`);

  console.log('--- Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
