import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContactWidget from '@/components/ContactWidget';
import ProductDetailClient from '@/components/product/ProductDetailClient'; // 引入组件

export const dynamic = 'force-dynamic';

interface ProductDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetail({ params }: ProductDetailProps) {
  const { id } = await params;

  // 1. 查询数据库：✅ 必须 include variants 以计算库存
  const product = await prisma.product.findUnique({
    where: { id },
    include: { 
      brand: true,
      variants: true 
    }
  });

  if (!product) {
    notFound();
  }

  // 2. 查询相关商品
  const relatedProducts = await prisma.product.findMany({
    where: { 
      brandId: product.brandId,
      id: { not: id } 
    },
    take: 4
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 pb-20">
      <ContactWidget />
      
      {/* 面包屑导航 (汉化) */}
      <nav className="border-b border-white/5 px-6 py-4 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Link href="/" className="hover:text-white transition">首页</Link>
          <span>/</span>
          <Link href="/product" className="hover:text-white transition">所有商品</Link>
          <span>/</span>
          <span className="text-zinc-300 truncate max-w-[150px]">{product.title}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        
        {/* ✅ 将原来的 grid 部分替换为客户端组件，样式已内置在组件中 */}
        <ProductDetailClient product={product} />

        {/* 底部推荐 (汉化标题，保持样式不变) */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-white/5 pt-12">
            <h3 className="text-xl font-bold text-white mb-8">相关推荐</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <Link key={rp.id} href={`/product/${rp.id}`} className="block group">
                  {/* 图片容器：保持 aspect-[4/5] */}
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
                  <p className="text-xs text-zinc-500">${Number(rp.basePrice).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}