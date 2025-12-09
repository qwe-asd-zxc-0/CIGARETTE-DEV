import { prisma } from '@/lib/prisma';
import AgeGate from '@/components/AgeGate';
import ProductSlider from '@/components/ProductSlider'; 
import ContactWidget from '@/components/ContactWidget';
import BrandStory from '@/components/BrandStory';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

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
    <main className="min-h-screen bg-black text-zinc-100 selection:bg-red-500/30 selection:text-white overflow-x-hidden">
      <AgeGate />
      <ContactWidget />
      
      {/* ⭐⭐⭐ 统一视觉容器 ⭐⭐⭐
        包裹 Hero 和 ProductSlider，共享同一个动态背景
      */}
      <div className="relative w-full">
        
        {/* === 1. 全局动态背景层 (贯穿 Hero 和 轮播图) === */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* 底纹图片：降低透明度，作为纹理 */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1559132039-b9d297ff0d05?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay" />
          
          {/* 深度渐变：确保底部自然过渡到黑色 */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-zinc-950/80 to-zinc-950" />

          {/* 💨 烟雾/光影动画核心 💨 */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-40">
            {/* 顶部主烟雾 - 深红 */}
            <div className="absolute -top-[10%] -left-[10%] w-[80vw] h-[80vw] bg-red-900/20 rounded-full blur-[120px] animate-smoke-flow-1 mix-blend-screen" />
            
            {/* 中部流动烟雾 - 琥珀色 (延伸到轮播图区域) */}
            <div className="absolute top-[40%] right-[-20%] w-[90vw] h-[90vw] bg-orange-900/10 rounded-full blur-[150px] animate-smoke-flow-2 mix-blend-screen" />
            
            {/* 底部氛围光 - 暗红 (轮播图底部) */}
            <div className="absolute bottom-[0%] left-[20%] w-[60vw] h-[60vw] bg-red-950/30 rounded-full blur-[100px] animate-smoke-flow-3" />
          </div>
        </div>

        {/* === 2. Hero 区域内容 (z-10) === */}
        <section className="relative z-10 min-h-[80vh] flex flex-col items-center justify-center px-4 pt-20 pb-10">
          
          {/* 标签 */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up shadow-2xl shadow-black/50">
            <Sparkles className="w-3.5 h-3.5 text-orange-500" />
            <span className="text-[10px] md:text-xs font-bold text-zinc-300 tracking-[0.2em] uppercase">
              Premium Tobacco & Logistics
            </span>
          </div>

          {/* 大标题 */}
          <h1 className="text-5xl md:text-7xl lg:text-9xl font-bold mb-6 tracking-tighter text-white drop-shadow-2xl text-center">
            GLOBAL <br className="md:hidden" />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-red-500 via-orange-600 to-red-800">
              TOBACCO
            </span>
          </h1>
          
          {/* 副标题 */}
          <p className="text-lg md:text-2xl text-zinc-300 max-w-2xl mx-auto font-light mb-10 leading-relaxed text-center opacity-90">
            Connecting the world's finest flavors.
            <span className="block text-zinc-500 text-sm mt-3 font-normal">
              全球正品购货 · 国际极速发货 · 100% 正品保障
            </span>
          </p>
          
          {/* 按钮组 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
            <Link 
              href="/product" 
              className="group relative inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-white transition-all duration-300 bg-red-700/90 backdrop-blur-sm rounded-full hover:bg-red-600 hover:shadow-[0_0_30px_-5px_rgba(220,38,38,0.6)] hover:-translate-y-1 w-full sm:w-auto"
            >
              <span className="tracking-widest">EXPLORE NOW</span>
              <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            
            <Link 
              href="/category" 
              className="group inline-flex items-center justify-center px-8 py-4 text-sm font-bold text-zinc-400 transition-all duration-300 bg-black/40 border border-white/10 rounded-full hover:bg-white/10 hover:text-white hover:border-white/20 backdrop-blur-sm w-full sm:w-auto"
            >
              <span className="tracking-widest">CATEGORIES</span>
            </Link>
          </div>
        </section>

        {/* === 3. 产品轮播区域 (z-10) === */}
        <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32 pt-10">
          {/* 标题栏 */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4 border-b border-white/5 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
                <span className="w-1.5 h-8 bg-gradient-to-b from-red-500 to-orange-600 rounded-full inline-block shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                Latest Arrivals
              </h2>
              <p className="text-zinc-400 font-light text-sm ml-5 tracking-wide">
                本周精选上架 / New in Stock
              </p>
            </div>
            
            <Link href="/product" className="group text-zinc-500 hover:text-white text-sm font-bold flex items-center gap-2 transition-colors">
              VIEW ALL 
              <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-red-600 transition-colors">
                <ArrowRight className="w-3 h-3" />
              </div>
            </Link>
          </div>
          
          {products.length === 0 ? (
            <div className="py-32 text-center border border-dashed border-white/10 rounded-2xl bg-white/5 backdrop-blur-sm">
              <p className="text-zinc-500 font-mono text-lg">暂无商品数据</p>
              <p className="text-zinc-600 text-sm mt-2">请运行 Seed 脚本或在后台添加商品</p>
            </div>
          ) : (
            /* 轮播容器：背景透明，让底层的烟雾透出来 */
            <div className="relative">
               {/* 轮播图左右两侧的羽化遮罩，防止切断感 */}
               <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-black/0 to-transparent z-10 pointer-events-none" />
               <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-black/0 to-transparent z-10 pointer-events-none" />
               
              <ProductSlider products={serializedProducts} />
            </div>
          )}
        </section>

        {/* 底部渐变遮罩：让轮播图区域自然过渡到 BrandStory */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none z-0" />
      </div>

      {/* === 4. 品牌故事区域 (独立背景) === */}
      <BrandStory />
    </main>
  );
}