/**
 * Database Client
 * Singleton Prisma client for database operations
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

// Create a singleton instance
const globalForPrisma = globalThis;

const prismaOptions = {
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient(prismaOptions);

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
        await prisma.$disconnect();
        process.exit(0);
    });
});

export default prisma;
