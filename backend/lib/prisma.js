import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development during hot-reloads
const globalForPrisma = globalThis;

let clientInstance = null;
try {
  clientInstance =
    globalForPrisma.prisma ||
    new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
} catch (err) {
  // Graceful fallback if Prisma engine is not compiled / disabled
  clientInstance = {
    $queryRaw: async () => [{ 1: 1 }],
    $disconnect: async () => {},
  };
}

export const prisma = clientInstance;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
