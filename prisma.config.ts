// prisma.config.ts
// 核心修复：从 prisma/config 导入 defineConfig（不是 @prisma/client）
// 需要在配置文件中手动加载 .env，Prisma 不会在执行配置文件前自动加载
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set; please configure environment variable.');
}

export default defineConfig({
  datasource: {
    provider: 'postgresql', // 必须添加：与 schema.prisma 中的数据库类型一致
    url: databaseUrl, // 保留你的 Supabase 连接地址
  },
  migrations: {
    seed: 'npx ts-node prisma/seed.ts', // 保留原种子脚本配置
  },
  // 可选：确保 Prisma Client 正常生成（避免后续调用报错）
  generator: {
    client: {
      provider: 'prisma-client-js',
    },
  },
});