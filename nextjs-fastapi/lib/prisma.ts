import { PrismaClient } from '@prisma/client'
import { withOptimize } from '@prisma/extension-optimize';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in environment variables');
  throw new Error('DATABASE_URL is required');
}

// Add connection pool parameters to DATABASE_URL with correct parameter names
const databaseUrl = `${process.env.DATABASE_URL}?pgbouncer=true&connection_timeout=60&pool_timeout=60&connection_limit=10`;

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // log: ['query'],
    transactionOptions: {
      maxWait: 60000,    // increased to 60 seconds
      timeout: 60000,    // increased to 60 seconds
      isolationLevel: 'ReadCommitted'  // added for better transaction handling
    },
    datasources: {
      db: {
        url: databaseUrl,  // Use the URL with connection pool parameters
      },
    }
  })
  // .$extends(
  //   withOptimize({ apiKey: process.env.OPTIMIZE_API_KEY! })
  // );

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma 