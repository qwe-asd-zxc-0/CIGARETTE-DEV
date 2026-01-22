import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductDetailClient from '@/components/product/ProductDetailClient';
import { getTrans } from '@/lib/i18n-utils';
import { getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

interface ProductDetailProps {
  params: Promise<{ id: string; locale: string }>;
}

export async function generateMetadata({ params }: ProductDetailProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ProductPage' });
  
  const product = await prisma.product.findUnique({
    where: { id },
    select: { title: true, description: true }
  });

  if (!product) {
    return {
      title: 'Product Not Found',
    };
  }

  return {
    title: `${getTrans(product.title, locale)} - Yankegou`,
    description: getTrans(product.description, locale) || t('globalSelection') 
  };
}

export default async function ProductDetail({ params }: ProductDetailProps) {
  const { id, locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ProductPage' });

  // 1. 查询数据库
  const rawProduct = await prisma.product.findUnique({
    where: { id },
    include: { 
      brand: true,
    }
  });

  if (!rawProduct) {
    notFound();
  }

  // 🔥 核心修复：手动序列化数据，将 Decimal 转为 number
  // 这一步是必须的，否则传给 Client Component 会报错
  const product = {
    ...rawProduct,
    basePrice: Number(rawProduct.basePrice), // Decimal -> Number
  };

  // 2. 查询相关商品
  const rawRelatedProducts = await prisma.product.findMany({
    where: { 
      brandId: rawProduct.brandId,
      id: { not: id },
      status: 'active'
    },
    include: { brand: true },
    take: 4
  });

  // 同样处理相关商品的 Decimal
  const relatedProducts = rawRelatedProducts.map(p => ({
    ...p,
    basePrice: Number(p.basePrice)
  }));

  return (
    <main className="min-h-screen bg-black text-zinc-100 pb-20 relative overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-neutral-950" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 relative z-10">
        
        {/* 传入序列化后的 product 数据 */}
        <ProductDetailClient product={product} />

        {/* 底部推荐 */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-white/5 pt-12">
            <h3 className="text-xl font-bold text-white mb-8">{t('relatedProducts') || '相关推荐'}</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <Link key={rp.id} href={`/product/${rp.id}`} className="block group">
                  <div className="aspect-[3/4] bg-zinc-900 rounded-lg mb-3 overflow-hidden border border-white/5">
                    {rp.coverImageUrl && (
                      <img 
                        src={rp.coverImageUrl} 
                        alt={getTrans(rp.title, locale)}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-100" 
                      />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-300 group-hover:text-white truncate">{getTrans(rp.title, locale)}</h4>
                  <p className="text-xs text-zinc-500">${rp.basePrice.toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}