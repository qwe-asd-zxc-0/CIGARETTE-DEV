import { prisma } from '@/lib/prisma';
// ❌ 移除 AgeGate 引用，因为它现在由 layout.tsx 中的 GlobalOverlay 全局管理
// import AgeGate from '@/components/AgeGate'; 
import ProductSlider from '@/components/ProductSlider'; 
import BrandStory from '@/components/BrandStory';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import ActivityBanner from "@/components/ActivityBanner"; 
import { setRequestLocale, getTranslations } from 'next-intl/server';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function Home({
  params
}: {
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;
  // 启用静态渲染
  setRequestLocale(locale);

  const t = await getTranslations('HomePage'); // ✅ 获取 HomePage 命名空间的翻译
  
  // 1. 获取轮播图商品 (优先获取 isFeatured=true)
  const featuredProducts = await prisma.product.findMany({
    where: { 
      status: 'active',
      isFeatured: true 
    },
    include: { brand: true },
    orderBy: { createdAt: 'desc' },
    take: 8,
  });

  // 如果推荐商品不足 4 个，则补充最新商品
  let displayProducts = featuredProducts;
  if (featuredProducts.length < 4) {
    const moreProducts = await prisma.product.findMany({
      where: { 
        status: 'active',
        id: { notIn: featuredProducts.map(p => p.id) } // 排除已获取的
      },
      include: { brand: true },
      orderBy: { createdAt: 'desc' },
      take: 8 - featuredProducts.length,
    });
    displayProducts = [...featuredProducts, ...moreProducts];
  }
  
  const serializedProducts = JSON.parse(JSON.stringify(displayProducts));

  return (
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-red-500/30 selection:text-white overflow-x-hidden">
    
      
      {/* ⭐⭐⭐ 统一视觉容器 ⭐⭐⭐ */}
      <div className="relative w-full">
        
        {/* === 1. 全局动态背景层 (z-0) === */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559132039-b9d297ff0d05?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          <div className="absolute inset-0 bg-linear-to-b from-black/40 via-zinc-950/80 to-zinc-950" />

          {/* 烟雾/光影动画 */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-40">
            <div className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] bg-red-900/20 rounded-full blur-[120px] animate-smoke-flow-1 mix-blend-screen" />
            <div className="absolute top-[40%] right-[-20%] w-[90vw] h-[90vw] bg-orange-900/10 rounded-full blur-[150px] animate-smoke-flow-2 mix-blend-screen" />
            <div className="absolute bottom-[0%] left-[20%] w-[60vw] h-[60vw] bg-red-950/30 rounded-full blur-[100px] animate-smoke-flow-3" />
          </div>
        </div>

        {/* === 2. Hero 区域 (z-10) === */}
        <section className="relative z-10 min-h-[55vh] md:min-h-[80vh] flex flex-col items-center justify-center px-4 pt-28 pb-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6 md:mb-8 animate-fade-in-up shadow-2xl shadow-black/50">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] md:text-xs font-bold text-zinc-300 tracking-[0.2em] uppercase">
              {t('subtitle')}
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold mb-4 md:mb-6 tracking-tighter text-white drop-shadow-2xl text-center">
            GLOBAL <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-linear-to-br from-red-500 via-orange-600 to-red-800">
              TOBACCO
            </span>
          </h1>
          
          <p className="text-lg md:text-2xl text-zinc-300 max-w-2xl mx-auto font-light mb-8 md:mb-10 leading-relaxed text-center opacity-90">
            {t('description')}
            <span className="block text-zinc-500 text-sm mt-3 font-normal">
              {t('brandSlogan')}
            </span>
          </p>
          
          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
            <Link 
              href="/product" 
              className="relative z-30 group inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white transition-all duration-300 bg-red-700/90 backdrop-blur-sm rounded-full hover:bg-red-600 hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.6)] hover:-translate-y-1 w-full sm:w-auto"
            >
              <span className="tracking-widest">{t('shopNow')}</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            
            <Link 
              href="/product" 
              className="relative z-30 group inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-zinc-400 transition-all duration-300 bg-black/40 border border-white/10 rounded-full hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-sm w-full sm:w-auto"
            >
              <span className="tracking-widest">{t('viewAll')}</span>
            </Link>
          </div>
        </section>

        {/* ✅ 3. 活动 Banner 区域 */}
        <div className="relative z-20 px-4 sm:px-6 mb-6 md:mb-10">
           <ActivityBanner />
        </div>

        {/* === 4. 产品轮播区域 (z-10) === */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32 pt-6 md:pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-linear-to-b from-red-500 to-orange-600 rounded-full inline-block shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                {t('latestArrivals')}
              </h2>
              <p className="text-zinc-400 font-light text-sm ml-5 tracking-wide">
                {t('newInStock')}
              </p>
            </div>
            
            <Link href="/product" className="relative z-30 group text-zinc-500 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors py-2">
              {t('viewAll')} 
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
          
          {serializedProducts.length === 0 ? (
            <div className="py-32 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
              <p className="text-zinc-500 font-mono text-lg">暂无商品数据</p>
            </div>
          ) : (
            <div className="relative">
               <div className="absolute left-0 top-0 bottom-0 w-12 bg-linear-to-r from-black/0 to-transparent z-10 pointer-events-none" />
               <div className="absolute right-0 top-0 bottom-0 w-12 bg-linear-to-l from-black/0 to-transparent z-10 pointer-events-none" />
               
              <ProductSlider products={serializedProducts} />
            </div>
          )}
        </section>

        <div className="absolute bottom-0 left-0 w-full h-32 bg-linear-to-t from-zinc-950 to-transparent pointer-events-none z-0" />
      </div>

      {/* === 5. 品牌故事区域 === */}
      <BrandStory />
    </main>
  );
}