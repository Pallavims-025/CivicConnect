import 'dotenv/config';
import bcrypt from 'bcrypt';
import { prisma } from '../backend/lib/prisma.js';

const BCRYPT_ROUNDS = 12;

function readAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || email?.split('@')[0];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set ADMIN_EMAIL to a valid email address in your local .env file.');
  }
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set ADMIN_PASSWORD to at least 12 characters and no more than 72 UTF-8 bytes.');
  }
  if (!name || name.length > 255) {
    throw new Error('Set ADMIN_NAME to a name of 1 to 255 characters, or use an email with a valid name before @.');
  }

  return { email, password, name };
}

async function seedInitialAdmin() {
  const { email, password, name } = readAdminConfig();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  await prisma.$transaction(async (tx) => {
    // Serializable isolation plus a locking read on the indexed role column
    // prevents overlapping setup runs from both observing an empty ADMIN range.
    const existingAdmin = await tx.$queryRaw`SELECT id FROM users WHERE role = 'ADMIN' LIMIT 1 FOR UPDATE`;
    if (existingAdmin.length > 0) {
      throw new Error('Administrator setup has already been completed. Existing administrator accounts were left unchanged.');
    }

    const existingEmail = await tx.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingEmail) {
      throw new Error('ADMIN_EMAIL already belongs to another account. Choose an unused email address.');
    }

    await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        approvalStatus: 'APPROVED',
        isActive: true,
      },
    });
  }, { isolationLevel: 'Serializable' });

  console.log(`Initial administrator account created for ${email}. Sign in through the existing Administrator login.`);
}

try {
  await seedInitialAdmin();
} catch (error) {
  console.error(`[seed:admin] ${error.message}`);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
