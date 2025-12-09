import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContactWidget from '@/components/ContactWidget';

export const dynamic = 'force-dynamic';

// 1. 定义 Props 类型，注意 params 是 Promise
interface ProductDetailProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetail({ params }: ProductDetailProps) {
  // 2. 必须先 await params 才能拿到 id
  const { id } = await params;

  // 3. 使用 id 查询数据库
  const product = await prisma.product.findUnique({
    where: { id },
    include: { brand: true }
  });

  if (!product) {
    notFound();
  }

  // 查询相关商品 (同品牌)
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
      
      {/* 面包屑导航 */}
      <nav className="border-b border-white/5 px-6 py-4 bg-zinc-900/50 sticky top-0 z-10 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center gap-2 text-xs font-mono text-zinc-500">
          <Link href="/" className="hover:text-white transition">HOME</Link>
          <span>/</span>
          <Link href="/product" className="hover:text-white transition">PRODUCT</Link>
          <span>/</span>
          <span className="text-zinc-300 truncate max-w-[150px]">{product.title}</span>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* 左侧：图片 */}
          <div className="space-y-4">
            <div className="aspect-[4/5] w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 relative group">
              {product.coverImageUrl ? (
                <img 
                  src={product.coverImageUrl} 
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
                  <span className="text-4xl mb-2">📷</span>
                  <span className="text-xs uppercase">No Preview</span>
                </div>
              )}
            </div>
          </div>

          {/* 右侧：信息 */}
          <div className="flex flex-col h-full">
            <div className="mb-2">
              <span className="text-red-500 font-bold tracking-wider text-sm uppercase">
                {product.brand?.name}
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
              {product.title}
            </h1>

            <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-8">
              <span className="text-3xl font-mono text-white">
                ${Number(product.basePrice).toFixed(2)}
              </span>
              <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 border border-white/5">
                Tax Included
              </span>
            </div>

            <div className="prose prose-invert prose-sm mb-10 text-zinc-400">
              <h3 className="text-white font-bold mb-2">Details</h3>
              <p>{product.description || "暂无详细描述"}</p>
            </div>

            <div className="mt-auto space-y-4">
              <div className="p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-sm text-red-200 mb-4">
                ⚠️ <span className="font-bold">Notice:</span> Please contact customer service to confirm stock.
                <br/>
                <span className="text-xs opacity-70">请联系客服确认库存及运费。</span>
              </div>
              
              {/* 仅作为展示，实际点击右下角悬浮窗联系 */}
              <button className="w-full py-4 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition cursor-default">
                CONTACT SUPPORT TO BUY
              </button>
            </div>
          </div>
        </div>

        {/* 底部推荐 */}
        {relatedProducts.length > 0 && (
          <div className="mt-24 border-t border-white/5 pt-12">
            <h3 className="text-xl font-bold text-white mb-8">Related Products</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map(rp => (
                <Link key={rp.id} href={`/product/${rp.id}`} className="block group">
                  <div className="aspect-[4/5] bg-zinc-900 rounded-lg mb-3 overflow-hidden border border-white/5">
                    {rp.coverImageUrl && (
                      <img src={rp.coverImageUrl} className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-80 group-hover:opacity-100" />
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