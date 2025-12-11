import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Layers, Globe, Sparkles, MapPin } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ProductPage({
  searchParams,
}: {
  searchParams: Promise<{ origin?: string }>; // ✅ 改回接收 origin
}) {
  const params = await searchParams;
  const origin = params?.origin; // ✅ 使用 origin

  // 1. 构造查询条件
  const where: any = { status: "active" };
  if (origin) {
    where.origin = origin; // ✅ 数据库里有这个字段
  }

  // 2. 并行查询
  const [products, origins] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.groupBy({
      by: ['origin'], // ✅ 按产地分组
      _count: true,
      where: { 
        status: "active", 
        origin: { not: null } 
      },
    })
  ]);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      
      {/* === 背景层 === */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-neutral-950" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')"
          }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
      </div>

      {/* === 内容层 === */}
      <div className="relative z-10 pt-28 pb-12">
        <div className="container mx-auto px-4">
          
          {/* === 页面标题 === */}
          <div className="mb-10 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-300 uppercase tracking-widest mb-3 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-red-500" /> Premium Collection
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight">
               Global Selections
             </h1>
          </div>

          {/* === 筛选栏 (这里虽然用 origin，但样式是新的导航栏样式) === */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
              
              {/* "All Regions" 按钮 */}
              <Link 
                href="/product"
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                  !origin 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" 
                    : "bg-zinc-900/50 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-md"
                }`}
              >
                <Globe className="w-4 h-4" />
                All Regions
              </Link>

              {/* 各产地按钮 */}
              {origins.map((o) => (
                o.origin && (
                  <Link
                    key={o.origin}
                    href={`/product?origin=${o.origin}`}
                    className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                      origin === o.origin
                        ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105"
                        : "bg-zinc-900/50 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-md"
                    }`}
                  >
                    <MapPin className={`w-3.5 h-3.5 ${origin === o.origin ? "text-red-600" : "text-zinc-500"}`} />
                    {o.origin}
                    <span className={`ml-1 text-[10px] ${origin === o.origin ? "opacity-100 font-extrabold" : "opacity-50"}`}>
                      {o._count}
                    </span>
                  </Link>
                )
              ))}
            </div>
          </div>

          {/* === 商品列表 === */}
          <div>
            <div className="flex justify-between items-end mb-6 px-2 border-b border-white/5 pb-4">
               <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  {origin ? (
                      <>
                          <MapPin className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> 
                          {origin} Collection
                      </>
                  ) : (
                      <>
                          <Globe className="w-6 h-6 text-zinc-400" />
                          All Regions
                      </>
                  )}
               </h2>
               <span className="text-zinc-500 text-sm font-mono">{products.length} Items</span>
            </div>

            {products.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
                <MapPin className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-50" />
                <p className="text-zinc-400 text-sm">No products found for this region.</p>
                <Link href="/product" className="text-white text-xs underline mt-2 inline-block hover:text-red-400 transition-colors">
                    View All Regions
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"> 
                {products.map((product) => (
                    <Link href={`/product/${product.id}`} key={product.id} className="group block relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-2">
                        
                        <div className="aspect-[3/4] bg-zinc-800/50 relative overflow-hidden">
                            {product.images && product.images[0] ? (
                                <img 
                                  src={product.images[0]} 
                                  alt={product.title} 
                                  className="w-full h-full object-cover group-hover:scale-110 group-hover:brightness-110 transition-all duration-700 ease-in-out"
                                />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
                                  <div className="w-8 h-8 rounded-full border border-white/10 mb-2" />
                                  <span className="text-[10px]">No Image</span>
                                </div>
                            )}
                            
                            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                            {product.origin && (
                               <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-zinc-300 font-bold uppercase tracking-wider border border-white/10 flex items-center gap-1 shadow-lg">
                                  {product.origin}
                               </div>
                            )}

                            <div className="absolute bottom-3 left-3 bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:bg-red-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] transition-all transform group-hover:scale-105">
                                ${Number(product.price).toFixed(2)}
                            </div>
                        </div>

                        <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                            <h3 className="text-zinc-100 font-bold text-sm truncate mb-1 group-hover:text-red-400 transition-colors">
                                {product.title}
                            </h3>
                            <div className="flex items-center justify-between">
                              <p className="text-zinc-500 text-[10px] truncate max-w-[70%] tracking-wide uppercase">
                                  {product.origin || "International"}
                              </p>
                              <div className="flex gap-1">
                                <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-red-500 transition-colors" />
                                <div className="w-1 h-1 rounded-full bg-zinc-700 group-hover:bg-red-500 transition-colors delay-75" />
                                <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover:bg-red-500 transition-colors delay-150" />
                              </div>
                            </div>
                        </div>
                    </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}