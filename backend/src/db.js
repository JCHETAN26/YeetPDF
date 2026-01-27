/**
 * Database Client
 * Singleton Prisma client for database operations
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';

// Load environment variables
config();

// Create a singleton instance with Prisma 7 configuration
const globalForPrisma = globalThis;

const prismaOptions = {
    log: process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
};

// For Prisma 7, we need to provide databaseUrl via accelerateUrl or adapter
// Using accelerateUrl as a simple pass-through for the connection string
if (process.env.DATABASE_URL) {
    prismaOptions.accelerateUrl = process.env.DATABASE_URL;
}

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
