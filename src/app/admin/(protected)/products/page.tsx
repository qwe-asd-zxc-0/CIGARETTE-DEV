import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Edit, Eye } from "lucide-react";
import DeleteProductButton from "@/components/admin/products/DeleteProductButton";
import ProductStatusBadge from "@/components/admin/products/ProductStatusBadge";

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  // 查询商品，同时包含品牌信息
  const products = await prisma.product.findMany({
    include: {
      brand: true,
      _count: {
        select: { variants: true } // 统计有多少个变体
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6">
      {/* 头部操作栏 */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">商品管理</h2>
        <Link 
          href="/admin/products/new" 
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> 新增商品
        </Link>
      </div>

      {/* 数据表格 */}
      <div className="bg-zinc-900 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="bg-white/5 text-zinc-100 uppercase font-bold text-xs tracking-wider">
            <tr>
              <th className="p-4">商品信息</th>
              <th className="p-4">品牌</th>
              <th className="p-4">价格</th>
              <th className="p-4">状态</th>
              <th className="p-4">规格</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {product.coverImageUrl && (
                      <img 
                        src={product.coverImageUrl} 
                        alt={product.title} 
                        className="w-10 h-10 rounded object-cover bg-white/10" 
                      />
                    )}
                    <div>
                      <p className="font-bold text-white">{product.title}</p>
                      <p className="text-xs">{product.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-white">{product.brand?.name || '-'}</td>
                <td className="p-4 font-mono text-white">${product.basePrice.toString()}</td>
                <td className="p-4">
                  <ProductStatusBadge productId={product.id} status={product.status || 'active'} />
                </td>
                <td className="p-4">
                  <span className="px-2 py-1 bg-zinc-800 rounded text-xs">
                    {product._count.variants} 项
                  </span>
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
            ))}
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