import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.globaltobacco.com'; // 替换为您的实际域名

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/profile/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
