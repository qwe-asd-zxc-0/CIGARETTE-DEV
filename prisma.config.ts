// prisma.config.ts
import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL, // 直接读取 .env 中的 Supabase 地址
  },
  migrations: {
    // 明确种子脚本执行命令（用 npx 确保环境变量生效）
    seed: 'npx ts-node prisma/seed.ts',
  },
});