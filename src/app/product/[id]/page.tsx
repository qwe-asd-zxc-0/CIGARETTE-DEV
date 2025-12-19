import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContactWidget from '@/components/ContactWidget';
import ProductDetailClient from '@/components/product/ProductDetailClient';

export const dynamic = 'force-dynamic';

interface ProductDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetail({ params }: ProductDetailProps) {
  const { id } = await params;

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
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <ContactWidget />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12">
        
        {/* 传入序列化后的 product 数据 */}
        <ProductDetailClient product={product} />

        {/* 底部推荐 */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-white/5 pt-12">
            <h3 className="text-xl font-bold text-white mb-8">相关推荐</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <Link key={rp.id} href={`/product/${rp.id}`} className="block group">
                  <div className="aspect-[4/5] bg-zinc-900 rounded-lg mb-3 overflow-hidden border border-white/5">
                    {rp.coverImageUrl && (
                      <img 
                        src={rp.coverImageUrl} 
                        alt={rp.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-100" 
                      />
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-zinc-300 group-hover:text-white truncate">{rp.title}</h4>
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