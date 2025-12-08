import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// 1. 获取数据库连接字符串
const connectionString = process.env.DATABASE_URL;

// 2. 创建原生 Postgres 连接池 (专门针对 Supabase 配置 SSL)
const pool = new Pool({ 
  connectionString,
  // 🔥 关键配置：Supabase 必须开启 SSL 才能连接
  ssl: { 
    rejectUnauthorized: false // 允许连接（即使证书是自签名的或由云提供商管理的）
  },
  max: 10, // 连接池最大连接数
  idleTimeoutMillis: 30000
});

// 3. 创建 Prisma 驱动适配器
const adapter = new PrismaPg(pool);

// 4. 初始化 PrismaClient (使用 adapter 模式)
export const prisma = globalForPrisma.prisma || new PrismaClient({ 
  adapter,
  // log: ['query', 'error'], // 调试时可开启
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;