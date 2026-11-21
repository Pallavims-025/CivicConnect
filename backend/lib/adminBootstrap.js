import bcrypt from 'bcrypt';

const BCRYPT_ROUNDS = 12;

function readAdminConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || email?.split('@')[0];

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set ADMIN_EMAIL to a valid email address in the local environment.');
  }
  if (typeof password !== 'string' || password.length < 12 || Buffer.byteLength(password, 'utf8') > 72) {
    throw new Error('Set ADMIN_PASSWORD to at least 12 characters and no more than 72 UTF-8 bytes.');
  }
  if (!name || name.length > 255) {
    throw new Error('Set ADMIN_NAME to a name of 1 to 255 characters, or use an email with a valid name before @.');
  }

  return { email, password, name };
}

export async function ensureConfiguredAdmin(prisma) {
  const { email, password, name } = readAdminConfig();
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  return prisma.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { email },
      select: { id: true, role: true, passwordHash: true },
    });

    if (existing) {
      if (existing.role !== 'ADMIN') {
        throw new Error('ADMIN_EMAIL already belongs to a non-administrator account. Choose an unused email address.');
      }
      // Repair legacy placeholder admins with no password, without resetting
      // the password of an already configured account during every restart.
      if (!existing.passwordHash) {
        await tx.user.update({
          where: { id: existing.id },
          data: { passwordHash, approvalStatus: 'APPROVED', isActive: true },
        });
        return { created: false, repaired: true };
      }
      return { created: false, repaired: false };
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
    return { created: true, repaired: false };
  });
}

export function hasAdminConfig() {
  return Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
}
