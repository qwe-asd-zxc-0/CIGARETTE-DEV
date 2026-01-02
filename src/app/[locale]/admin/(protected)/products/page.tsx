import { prisma } from "@/lib/prisma";
import { getTrans } from "@/lib/i18n-utils";
import Link from "next/link";
import { Plus, Edit, Eye, Search } from "lucide-react";
import DeleteProductButton from "@/components/admin/products/DeleteProductButton";
import ProductStatusBadge from "@/components/admin/products/ProductStatusBadge";

export const dynamic = 'force-dynamic';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; stock?: string }>;
}) {
  const { q, stock } = await searchParams;

  // 构建查询条件
  const where: any = {};
  if (q) {
    where.OR = [
      { title: { path: ['en'], string_contains: q } },
      { title: { path: ['zh'], string_contains: q } }, // ✅ 支持中文标题搜索
      { slug: { contains: q, mode: 'insensitive' } },
      { skuCode: { contains: q, mode: 'insensitive' } }, // ✅ 支持 SKU 搜索
      { brand: { name: { path: ['en'], string_contains: q } } }, // ✅ 支持品牌搜索
      { brand: { name: { path: ['zh'], string_contains: q } } },
    ];
  }
  if (stock === 'low') {
    where.stockQuantity = { lt: 10, gt: 0 };
  } else if (stock === 'out') {
    where.stockQuantity = 0;
  }

  // 查询商品，同时包含品牌信息
  const products = await prisma.product.findMany({
    where,
    include: {
      brand: true,
      // _count: { select: { variants: true } } // ❌ 移除：variants 表已删除
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">商品管理 (Products)</h2>
          <p className="text-zinc-400 text-sm mt-1">管理商品信息、库存和上下架状态。</p>
        </div>
        <Link 
          href="/admin/products/new" 
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> 新增商品
        </Link>
      </div>

      {/* 筛选工具栏 */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-white/10">
          <Link
            href="/admin/products"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !stock ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            全部商品
          </Link>
          <Link
            href="/admin/products?stock=low"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              stock === 'low' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            库存紧张 (&lt;10)
          </Link>
          <Link
            href="/admin/products?stock=out"
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              stock === 'out' ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            已售罄 (0)
          </Link>
        </div>

        {/* 简单的搜索表单 */}
        <form className="relative group w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
          <input
            name="q"
            defaultValue={q}
            type="text"
            placeholder="搜索商品名称..."
            className="w-full bg-zinc-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-red-600 transition-all"
          />
        </form>
      </div>

      {/* 数据表格 */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/5 text-zinc-100 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="p-4">商品信息</th>
              <th className="p-4">品牌</th>
              <th className="p-4">价格</th>
              <th className="p-4">库存 (Stock)</th>
              <th className="p-4">状态</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => {
              const stock = product.stockQuantity || 0;
              const isLow = stock < 10 && stock > 0;
              const isOut = stock === 0;

              return (
                <tr key={product.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {product.coverImageUrl && (
                        <img 
                          src={product.coverImageUrl} 
                          alt={getTrans(product.title, 'en')} 
                          className="w-10 h-10 rounded object-cover bg-white/10" 
                        />
                      )}
                      <div>
                        <p className="font-bold text-white">{getTrans(product.title, 'zh')}</p>
                        <p className="text-xs">{product.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white">{getTrans(product.brand?.name, 'en') || '-'}</td>
                  <td className="p-4 font-mono text-white">${product.basePrice.toString()}</td>
                  <td className="p-4">
                    <span className={`font-mono font-bold ${
                      isOut ? "text-red-500" : isLow ? "text-orange-500" : "text-zinc-300"
                    }`}>
                      {stock}
                    </span>
                    {isOut && <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">OUT</span>}
                  </td>
                  <td className="p-4">
                    <ProductStatusBadge productId={product.id} status={product.status || 'active'} />
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link 
                        href={`/admin/products/${product.id}`} 
                        className="p-2 text-zinc-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-all" 
                        title="编辑"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <DeleteProductButton productId={product.id} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {products.length === 0 && (
          <div className="p-8 text-center text-zinc-500">
            暂无商品数据，请点击右上角新增。
          </div>
        )}
      </div>
    </div>
  );
}