import { prisma } from '@/lib/prisma';
import AgeGate from '@/components/AgeGate';
import ProductSlider from '@/components/ProductSlider'; // 直接导入即可

// 强制动态渲染 (确保每次刷新都能获取最新库存和价格)
export const dynamic = 'force-dynamic';

export default async function Home() {
  // 1. 从数据库读取所有上架商品
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: { brand: true },
    orderBy: { createdAt: 'desc' },
    take: 8, // 限制数量
  });

  // 序列化数据 (防止 Date/Decimal 对象报错)
  const serializedProducts = JSON.parse(JSON.stringify(products));

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-red-500/30 selection:text-white">
      <AgeGate />

      {/* Hero 区域 */}
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
              Global Authentic Shopping • Fast Shipping • 100% Authentic
            </p>
            <p className="text-xs text-zinc-500 font-sans tracking-widest">
              全球正品购货 · 国际极速发货 · 100% 正品保证
            </p>
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
    </main>
  );
}