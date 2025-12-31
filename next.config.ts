import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // 1. React Compiler 配置
  reactCompiler: true,

  // ✅ 新增：把这段配置加到这里
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // 设置为你需要的大小，比如 50mb
    },
  },

  // 2. 图片域名配置
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ukfchupiviprnschjpyf.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withNextIntl(nextConfig);