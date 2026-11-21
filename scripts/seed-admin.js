import 'dotenv/config';
import { prisma } from '../backend/lib/prisma.js';
import { ensureConfiguredAdmin } from '../backend/lib/adminBootstrap.js';

try {
  const result = await ensureConfiguredAdmin(prisma);
  console.log(result.created ? 'Initial administrator account created.' : result.repaired ? 'Administrator account password initialized.' : 'Configured administrator account already exists.');
} catch (error) {
  console.error(`[seed:admin] ${error.message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
