import { PrismaClient } from '@prisma/client'
import { withOptimize } from '@prisma/extension-optimize';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  throw new Error('DATABASE_URL is required');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: ['query'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }).$extends(
    withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
  );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 