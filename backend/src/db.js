/**
 * Database Client
 * Singleton Prisma client for database operations
 */

import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

// Load environment variables
config();

// Create a singleton instance with Prisma 7 configuration
const globalForPrisma = globalThis;

// Create PostgreSQL connection pool
const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

const prismaOptions = {
    adapter,
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
        await pool.end();
        process.exit(0);
    });
});

export default prisma;
