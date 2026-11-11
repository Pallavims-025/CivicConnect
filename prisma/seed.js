// CivicConnect - Prisma Seed Script
// Synchronizes the 8 public-facing categories without deleting category records.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const initialCategories = [
  {
    name: 'Road Problems',
    aliases: ['Potholes', 'Roads & Potholes'],
    description: 'Potholes, cracked or damaged road surfaces, and other unsafe road conditions.',
  },
  {
    name: 'Water Supply',
    aliases: ['Water Leakage'],
    description: 'Water outages, low pressure, leaks in public supply lines, and water quality concerns.',
  },
  {
    name: 'Drainage & Sewage',
    aliases: ['Drainage Issues'],
    description: 'Blocked drains, sewage overflows, damaged manholes, and wastewater issues.',
  },
  {
    name: 'Garbage Management',
    aliases: ['Garbage Accumulation', 'Garbage & Waste'],
    description: 'Missed waste collection, overflowing public bins, and illegal dumping.',
  },
  {
    name: 'Streetlights',
    aliases: ['Broken Streetlights'],
    description: 'Streetlights that are damaged, flickering, or not working.',
  },
  {
    name: 'Electricity',
    aliases: [],
    description: 'Public electrical hazards, exposed wires, damaged poles, and outages affecting civic spaces.',
  },
  {
    name: 'Stray Animals',
    aliases: [],
    description: 'Unowned animals in public areas that need collection, care, or safety assistance.',
  },
  {
    name: 'Traffic & Parking',
    aliases: [],
    description: 'Traffic signal or signage issues, blocked streets, and unsafe or obstructive parking.',
  },
];

async function main() {
  console.log('--- Starting CivicConnect Category Seeding ---');

  const existingCategories = await prisma.category.findMany();
  const retainedIds = new Set();
  for (const category of initialCategories) {
    const record = existingCategories.find((item) => item.name === category.name)
      || existingCategories.find((item) => category.aliases.includes(item.name) && !retainedIds.has(item.id));
    const data = { name: category.name, description: category.description, isActive: true };
    const saved = record
      ? await prisma.category.update({ where: { id: record.id }, data })
      : await prisma.category.create({ data });
    retainedIds.add(saved.id);
    console.log(`✓ Seeded category [ID: ${saved.id}]: ${saved.name}`);
  }
  await prisma.category.updateMany({ where: { id: { notIn: [...retainedIds] } }, data: { isActive: false } });

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
