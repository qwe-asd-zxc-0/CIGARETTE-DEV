import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Globe, Sparkles, MapPin, Package, Search } from "lucide-react";
import SearchInput from "@/components/SearchInput";
import Pagination from "@/components/Pagination";
import { getTranslations } from 'next-intl/server';
import { getTrans } from "@/lib/i18n-utils";

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 20;

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ origin?: string; q?: string; page?: string; category?: string; inStock?: string }>;
}) {
  const { locale } = await params;
  const searchParamsValue = await searchParams;
  const origin = searchParamsValue?.origin;
  const query = searchParamsValue?.q || "";
  const category = searchParamsValue?.category;
  const inStockParam = searchParamsValue?.inStock; // 保持原始字符串，用于判断是否未定义
  const currentPage = Number(searchParamsValue?.page) || 1;
  const t = await getTranslations({ locale, namespace: 'ProductPage' });

  // 1. 构造查询条件
  const where: any = { 
    status: "active" 
  };

  if (origin) {
    where.origin = origin;
  }

  // ✅ 修复：针对 JSON 字段的精确匹配
  if (category) {
    where.category = {
      path: ['en'],     // 告诉 Prisma 去 JSON 的 "en" 键里找
      equals: category  // 匹配的值
    };
  }

  if (query) {
    const searchConditions: any[] = [
      // { title: { contains: query, mode: 'insensitive' } }, // ❌ JSON 字段不支持直接 contains
      // 暂时仅支持英文标题搜索，或者回退到仅搜索产地和品牌
      { title: { path: ['en'], string_contains: query } }, 
      { title: { path: ['zh'], string_contains: query } }, // ✅ 增加中文标题搜索
      { origin: { contains: query, mode: 'insensitive' } },
      { brand: { name: { path: ['en'], string_contains: query } } }, // ✅ 修复：JSON 字段搜索
      { brand: { name: { path: ['zh'], string_contains: query } } }  // ✅ 修复：JSON 字段搜索
    ];
    
    if (category) {
      // 如果同时有分类和搜索，需要合并条件
      where.AND = [
        ...(where.AND || []),
        { OR: searchConditions }
      ];
    } else {
      where.OR = searchConditions;
    }
  }

  // 2. 并行查询
  let [products, totalCount, origins] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { 
        brand: true,
      },
      take: PAGE_SIZE * 10, // 先取更多，然后在内存中过滤
      skip: 0,
    }),
    prisma.product.count({ where }),
    prisma.product.groupBy({
      by: ['origin'],
      _count: true,
      where: { status: "active", origin: { not: null } },
    })
  ]);

  // 3. 库存过滤逻辑（在内存中执行）
  if (inStockParam !== undefined) {
    const hasStock = inStockParam === 'true';
    products = products.filter((product) => {
      const totalStock = product.stockQuantity || 0;
      return hasStock ? totalStock > 0 : totalStock <= 0;
    });
  }

  // 4. 应用分页
  const filteredProducts = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const filteredTotalCount = products.length;
  const totalPages = Math.ceil(filteredTotalCount / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      
      {/* 背景层 (保持不变) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-neutral-950" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
      </div>

      {/* 内容层 */}
      <div className="relative z-10 pt-28 pb-12">
        <div className="container mx-auto px-4">
          
          {/* 页面标题 & 搜索 */}
          <div className="mb-8 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-300 uppercase tracking-widest mb-3 backdrop-blur-sm">
                <Sparkles className="w-3 h-3 text-red-500" /> {t('selectionSeries')}
             </div>
             <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-tight mb-6">
               {t('globalSelection')}
             </h1>
             <div className="mb-8 w-full max-w-lg mx-auto">
               <SearchInput />
             </div>
          </div>

          {/* 筛选栏 */}
          <div className="mb-12">
            <div className="flex flex-wrap justify-center gap-3 max-w-5xl mx-auto">
              <Link 
                href="/product"
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                  !origin 
                    ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" 
                    : "bg-zinc-900/50 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-md"
                }`}
              >
                <Globe className="w-4 h-4" />
                {t('allRegions')}
              </Link>

              {origins.map((o) => (
                o.origin && (
                  <Link
                    key={o.origin}
                    href={`/product?origin=${o.origin}${query ? `&q=${query}` : ''}${inStockParam ? `&inStock=${inStockParam}` : ''}`}
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

              {/* 库存筛选按钮 */}
              <div className="w-full flex justify-center gap-3 mt-4">
                <Link 
                  href={`/product${origin ? `?origin=${origin}` : ''}${query ? `${origin ? '&' : '?'}q=${query}` : ''}`}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                    !inStockParam 
                      ? "bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-105" 
                      : "bg-zinc-900/50 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-md"
                  }`}
                >
                  <Package className="w-4 h-4" />
                  {t('allStock')}
                </Link>

                <Link 
                  href={`/product?inStock=true${origin ? `&origin=${origin}` : ''}${query ? `&q=${query}` : ''}`}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                    inStockParam === 'true'
                      ? "bg-green-600/90 text-white border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105"
                      : "bg-zinc-900/50 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-md"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${inStockParam === 'true' ? "bg-white animate-pulse" : "bg-green-500"}`} />
                  {t('inStock')}
                </Link>

                <Link 
                  href={`/product?inStock=false${origin ? `&origin=${origin}` : ''}${query ? `&q=${query}` : ''}`}
                  className={`px-6 py-2.5 rounded-full text-xs font-bold transition-all border flex items-center gap-2 ${
                    inStockParam === 'false'
                      ? "bg-red-600/90 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.3)] scale-105"
                      : "bg-zinc-900/50 text-zinc-400 border-white/10 hover:bg-white/10 hover:text-white hover:border-white/30 backdrop-blur-md"
                  }`}
                >
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  {t('outOfStock')}
                </Link>
              </div>
            </div>
          </div>

          {/* 商品列表 */}
          <div>
            <div className="flex justify-between items-end mb-6 px-2 border-b border-white/5 pb-4">
               <div className="flex flex-col gap-1">
                 <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    {query ? (
                        <>
                            <Search className="w-6 h-6 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                            "{query}" {t('searchResultsFor')}
                        </>
                    ) : origin ? (
                        <>
                            <MapPin className="w-6 h-6 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]" /> 
                            {origin} {t('selectionSeriesSuffix')}
                        </>
                    ) : (
                        <>
                            <Globe className="w-6 h-6 text-zinc-400" />
                            {t('allRegionsTitle')}
                        </>
                    )}
                 </h2>
                 {(origin && query) && (
                   <span className="text-xs text-zinc-500 ml-8">{t('locatedIn')} {origin}</span>
                 )}
               </div>

               <span className="text-zinc-500 text-sm font-mono">
                 {filteredTotalCount > 0 ? (
                    <>
                      {t('showing')} {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, filteredTotalCount)} {t('itemsTotal')} {filteredTotalCount}
                    </>
                 ) : (
                   t('zeroItems')
                 )}
               </span>
            </div>

            {products.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-white/10 rounded-3xl bg-white/5 backdrop-blur-sm">
                <Search className="w-12 h-12 text-zinc-600 mx-auto mb-3 opacity-50" />
                <p className="text-zinc-400 text-sm">
                  {query ? `${t('noMatches')} "${query}"` : t('noItems')}
                </p>
                <Link href="/product" className="text-white text-xs underline mt-2 inline-block hover:text-red-400 transition-colors">
                    {t('clearFilters')}
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"> 
                  {filteredProducts.map((product) => {
                    const displayImage = product.coverImageUrl || (product.images && product.images[0]);
                    
                    // 计算总库存
                    const totalStock = product.stockQuantity || 0;
                    const isOutOfStock = totalStock <= 0;

                    return (
                      <Link 
                        href={`/product/${product.id}`} 
                        key={product.id} 
                        className={`group block relative bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden hover:border-red-500/30 hover:shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-all duration-300 hover:-translate-y-2 ${isOutOfStock ? 'opacity-75 grayscale-[0.5]' : ''}`}
                      >
                          <div className="aspect-[3/4] bg-zinc-800/50 relative overflow-hidden">
                              {displayImage ? (
                                  <img 
                                    src={displayImage} 
                                    alt={getTrans(product.title, locale)} 
                                    className="w-full h-full object-contain p-2 group-hover:scale-105 group-hover:brightness-110 transition-all duration-700 ease-in-out" 
                                  />
                              ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600 bg-zinc-900">
                                    <Package className="w-8 h-8 opacity-20 mb-2" />
                                    <span className="text-[10px]">{t('noImage')}</span>
                                  </div>
                              )}
                              
                              <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                              
                              {/* 库存标签 (汉化) */}
                              <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-[10px] font-bold border backdrop-blur-md shadow-lg flex items-center gap-1 z-10 ${
                                isOutOfStock 
                                  ? "bg-red-600/90 border-red-500 text-white" 
                                  : "bg-black/60 border-white/10 text-green-400"
                              }`}>
                                 <div className={`w-1.5 h-1.5 rounded-full ${isOutOfStock ? "bg-white" : "bg-green-500 animate-pulse"}`} />
                                 {isOutOfStock ? t('soldOut') : `${t('stock')}: ${totalStock}`}
                              </div>

                              {/* 产地标签 */}
                              {product.origin && (
                                 <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] text-zinc-300 font-bold uppercase tracking-wider border border-white/10 shadow-lg">
                                    {product.origin}
                                 </div>
                              )}

                              {/* 价格标签 */}
                              <div className="absolute bottom-3 left-3 bg-white text-black px-3 py-1 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.4)] group-hover:bg-red-600 group-hover:text-white group-hover:shadow-[0_0_15px_rgba(220,38,38,0.6)] transition-all transform group-hover:scale-105">
                                  ${Number(product.basePrice).toFixed(2)}
                              </div>
                          </div>

                          <div className="p-4 border-t border-white/5 bg-white/[0.02]">
                              <h3 className="text-zinc-100 font-bold text-sm truncate mb-1 group-hover:text-red-400 transition-colors">
                                  {getTrans(product.title, locale)}
                              </h3>
                              <div className="flex items-center justify-between">
                                <p className="text-zinc-500 text-[10px] truncate max-w-[70%] tracking-wide uppercase flex items-center gap-1">
                                    {product.brand ? (
                                      <span className="text-zinc-400 font-semibold">{getTrans(product.brand.name, locale)}</span>
                                    ) : (
                                      <span>{product.origin || t('internationalVersion')}</span>
                                    )}
                                </p>
                                <div className="flex gap-1">
                                  <div className="w-1 h-1 rounded-full bg-zinc-600 group-hover:bg-red-500 transition-colors" />
                                  <div className="w-1 h-1 rounded-full bg-zinc-700 group-hover:bg-red-500 transition-colors delay-75" />
                                  <div className="w-1 h-1 rounded-full bg-zinc-800 group-hover:bg-red-500 transition-colors delay-150" />
                                </div>
                              </div>
                          </div>
                      </Link>
                    );
                  })}
                </div>

                <Pagination 
                  currentPage={currentPage} 
                  totalPages={totalPages} 
                  searchParams={searchParamsValue}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}