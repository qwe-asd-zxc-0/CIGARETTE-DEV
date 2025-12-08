import { PrismaClient } from '@prisma/client';

// Prisma 客户端单例模式（防止开发环境热更新导致连接数耗尽）
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;