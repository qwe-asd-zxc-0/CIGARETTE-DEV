import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.globaltobacco.com'; // 替换为您的实际域名

  // 1. 静态页面
  const staticRoutes = [
    '',
    '/login',
    '/sign-up',
    '/product',
    '/cart',
    '/shipping-policy',
    '/refund-policy',
    '/terms',
    '/privacy',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. 动态商品页面 (从数据库获取)
  // 注意：为了构建性能，这里只取前 1000 个活跃商品
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    select: { id: true, updatedAt: true },
    take: 1000,
    orderBy: { updatedAt: 'desc' }
  });

  const productRoutes = products.map((product) => ({
    url: `${baseUrl}/product/${product.id}`,
    lastModified: product.updatedAt || new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...productRoutes];
}
