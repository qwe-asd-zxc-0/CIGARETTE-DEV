import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import ContactWidget from '@/components/ContactWidget';

export const dynamic = 'force-dynamic';

export default async function AllProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: 'active' },
    include: { brand: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      <ContactWidget />
      
      {/* 顶部标题区 */}
      <div className="bg-zinc-900 border-b border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <Link href="/" className="text-xs font-mono text-zinc-500 hover:text-white mb-4 block">&larr; BACK TO HOME</Link>
              <h1 className="text-4xl font-bold text-white tracking-tight">All Products</h1>
              <p className="text-zinc-400 mt-2 text-sm">Full Catalog Collection</p>
            </div>
            <div className="text-zinc-500 font-mono text-sm">
              TOTAL: <span className="text-white">{products.length}</span> ITEMS
            </div>
          </div>
        </div>
      </div>

      {/* 商品网格 */}
      <div className="max-w-7xl mx-auto p-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 gap-y-10">
          {products.map((product) => (
            <Link key={product.id} href={`/product/${product.id}`} className="group block">
              <div className="bg-zinc-900/40 rounded-xl overflow-hidden hover:bg-zinc-900 transition-all duration-300 h-full flex flex-col ring-1 ring-white/5 hover:ring-white/10 hover:shadow-2xl">
                
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
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col">
                  <div className="text-xs text-red-500 font-bold mb-1 uppercase tracking-wider">
                    {product.brand?.name}
                  </div>
                  <h3 className="text-sm font-bold text-zinc-200 mb-2 line-clamp-2 group-hover:text-white">
                    {product.title}
                  </h3>
                  <div className="mt-auto pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-lg font-mono text-zinc-100">
                      ${Number(product.basePrice).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}