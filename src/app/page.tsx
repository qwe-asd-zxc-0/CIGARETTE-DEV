import { prisma } from '@/lib/prisma';
import AgeGate from '@/components/AgeGate';
import ProductSlider from '@/components/ProductSlider'; 
import ContactWidget from '@/components/ContactWidget';
import BrandStory from '@/components/BrandStory';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: { brand: true },
    orderBy: { createdAt: 'desc' },
    take: 8, 
  });
  
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500/30 selection:text-white">
      <AgeGate />
      <ContactWidget />
      
      {/* Hero 区域 */}
      <section className="relative h-[70vh] flex flex-col items-center justify-center border-b border-white/5 bg-[url('https://images.unsplash.com/photo-1559132039-b9d297ff0d05?auto=format&fit=crop&q=80')] bg-cover bg-center">
        
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[1px]" /> 
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 tracking-tight">
            GLOBAL TOBACCO
          </h1>
          
          <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto font-light mb-8">
            Global Tobacco & International Logistics
          </p>
          
          <div className="flex flex-col items-center gap-3 pt-4 border-t border-white/10 w-full">
            <p className="text-sm text-zinc-400 font-mono tracking-wider uppercase">
              Global Authentic Shopping • Fast Shipping • 100% Authentic
            </p>
            <p className="text-xs text-zinc-500 font-sans tracking-widest mb-8">
              全球正品购货 · 国际极速发货 · 100% 正品保证
            </p>

            {/* 👇 跳转按钮 👇 */}
            <Link 
              href="/product" 
              className="group relative inline-flex items-center justify-center px-8 py-3 text-sm font-bold text-white transition-all duration-200 bg-red-600 font-mono rounded-full hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/30 hover:-translate-y-1"
            >
              <span>EXPLORE COLLECTION</span>
              <svg className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* 轮播展示区域 */}
      <section className="max-w-7xl mx-auto p-8 py-16">
        <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">Latest Arrivals</h2>
          <span className="text-zinc-500 text-sm font-mono">/ SELECTED ITEMS</span>
        </div>
        
        {products.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
            <p className="text-zinc-500 font-mono">暂无商品，请运行 seed 脚本上货</p>
          </div>
        ) : (
          <div className="mt-8">
            <ProductSlider products={serializedProducts} />
          </div>
        )}
      </section>

      {/* 品牌故事区域 */}
      <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 border-t border-white/5">
        <BrandStory />
      </section>
    </main>
  );
}