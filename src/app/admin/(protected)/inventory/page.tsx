import { prisma } from "@/lib/prisma";
import InventoryTable from "@/components/admin/inventory/InventoryTable";
import { PackageOpen } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  // 查询变体数据
  const rawVariants = await prisma.productVariant.findMany({
    include: {
      product: {
        select: {
          title: true,
          coverImageUrl: true,
        },
      },
      _count: {
        select: { 
          // ✅ 修复：字段名必须与 schema.prisma 中的定义 (restockSubs) 一致
          restockSubs: {
            where: { isNotified: false } // 只统计等待通知的人数
          } 
        },
      },
    },
    orderBy: [
      { stockQuantity: 'asc' }, 
    ],
  });

  // 格式化数据：将 Decimal 转换为 Number
  const variants = rawVariants.map(v => ({
    ...v,
    price: v.price ? Number(v.price) : 0,
  }));

  return (
    <div className="space-y-6">
      {/* 头部区域 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <PackageOpen className="w-8 h-8 text-red-600" />
            库存管理 (Inventory & Stock)
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            监控库存水平并管理补货通知。
          </p>
        </div>
        
        {/* 顶部统计小条 */}
        <div className="flex gap-4">
          <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">库存紧张 (Low Stock)</p>
            <p className="text-xl font-bold text-orange-500">
              {variants.filter(v => (v.stockQuantity || 0) < 10 && (v.stockQuantity || 0) > 0).length}
            </p>
          </div>
          <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-zinc-500 uppercase tracking-wider">已售罄 (Out of Stock)</p>
            <p className="text-xl font-bold text-red-500">
              {variants.filter(v => (v.stockQuantity || 0) === 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* 库存表格 */}
      <InventoryTable variants={variants} />
    </div>
  );
}