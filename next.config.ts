import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // 1. React Compiler 配置 (Next.js 16+ 已稳定，直接写在顶层)
  reactCompiler: true,

  // 2. 图片域名配置 (解决 Invalid src prop 报错)
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ukfchupiviprnschjpyf.supabase.co', // 您的 Supabase 项目域名
        port: '',
        pathname: '/storage/v1/object/public/**', // 允许访问公共存储桶下的所有路径
      },
    ],
  },
};

export default withNextIntl(nextConfig);