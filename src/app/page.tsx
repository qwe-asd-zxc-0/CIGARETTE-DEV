import { prisma } from '@/lib/prisma';
import AgeGate from '@/components/AgeGate';
import Link from 'next/link';

// 强制动态渲染 (确保每次刷新都能获取最新库存和价格)
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. 从数据库读取所有上架商品
  const products = await prisma.product.findMany({
    where: { status: 'active' }, // 只查状态为 active 的
    include: { brand: true },    // 顺便把品牌信息也查出来
    orderBy: { createdAt: 'desc' } // 按创建时间倒序
  });

  return (
    // ✨ 修改 1：背景色改为 bg-zinc-950，文字颜色更加柔和
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500/30 selection:text-white">
      {/* 1. 年龄验证弹窗 (保留) */}
      <AgeGate />

      {/* 2. 顶部 Hero 区域 */}
      <section className="relative h-[60vh] flex flex-col items-center justify-center border-b border-white/5 bg-[url('https://images.unsplash.com/photo-1559132039-b9d297ff0d05?auto=format&fit=crop&q=80')] bg-cover bg-center">
        {/* 黑色遮罩层，加深一点以突出文字 */}
        <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-[1px]" /> 
        
        <div className="relative z-10 text-center px-4">
          {/* 主标题：增加字间距，显得更稳重 */}
          <h1 className="text-6xl md:text-8xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-600 tracking-tight">
            GLOBAL TOBACCO
          </h1>
          
          {/* 副标题 */}
          <p className="text-xl md:text-2xl text-zinc-300 max-w-2xl mx-auto font-light">
            Global Tobacco & International Logistics
          </p>
          
          {/* 双语标语 */}
          <div className="mt-8 flex flex-col items-center gap-2 border-t border-white/10 pt-6">
            <p className="text-sm text-zinc-400 font-mono tracking-wider uppercase">
              Direct from Factory • Fast Shipping • 100% Authentic
            </p>
            <p className="text-xs text-zinc-500 font-sans tracking-widest">
              源头工厂直供 · 国际极速发货 · 100% 正品保证
            </p>
          </div>
        </div>
      </section>

      {/* 3. 商品展示区域 */}
      <section className="max-w-7xl mx-auto p-8 py-16">
        <div className="flex justify-between items-end mb-10 border-b border-white/5 pb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-zinc-100">Latest Arrivals</h2>
          <span className="text-zinc-500 text-sm font-mono">/ {products.length} ITEMS</span>
        </div>
        
        {/* 空状态处理 */}
        {products.length === 0 ? (
          <div className="py-24 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
            <p className="text-zinc-500 font-mono">暂无商品，请运行 seed 脚本上货</p>
          </div>
        ) : (
          /* 商品网格 */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <Link key={product.id} href={`/product/${product.id}`} className="group block h-full">
                {/* ✨ 修改 2：卡片去掉了边框，改用深色背景和悬停效果 */}
                <div className="bg-zinc-900/40 rounded-xl overflow-hidden hover:bg-zinc-900 transition-all duration-300 h-full flex flex-col ring-1 ring-white/5 hover:ring-white/10 hover:shadow-2xl hover:shadow-black/50">
                  
                  {/* 商品图片区域 */}
                  <div className="aspect-[4/5] bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                    {product.coverImageUrl ? (
                      <img 
                        src={product.coverImageUrl} 
                        alt={product.title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500 ease-out opacity-90 group-hover:opacity-100" 
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-zinc-600">
                        <span className="text-4xl">📷</span>
                        <span className="text-xs uppercase tracking-widest">No Preview</span>
                      </div>
                    )}
                    {/* HOT 标签 - 改为深红色半透明 */}
                    <div className="absolute top-3 left-3 bg-red-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-sm shadow-lg">
                      HOT
                    </div>
                  </div>
                  
                  {/* 商品信息区域 */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs text-red-500/80 font-bold mb-1.5 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                      {product.brand?.name || 'Generic'}
                    </div>
                    
                    <h3 className="text-lg font-bold text-zinc-200 mb-3 line-clamp-2 group-hover:text-white transition-colors">
                      {product.title}
                    </h3>
                    
                    <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/5 group-hover:border-white/10 transition-colors">
                      <span className="text-xl font-mono text-zinc-100 tracking-tight">
                        ${Number(product.basePrice).toFixed(2)}
                      </span>
                      {/* 购买按钮 - 改为圆形图标 */}
                      <button className="w-9 h-9 rounded-full bg-zinc-100 text-black flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg shadow-white/5">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}