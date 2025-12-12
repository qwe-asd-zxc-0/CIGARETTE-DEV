import { prisma } from "@/lib/prisma";
import { ClipboardList } from "lucide-react";
import OrderTable from "@/components/admin/orders/OrderTable";

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  // 获取订单数据，包含关联表
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { email: true, fullName: true }
      },
      items: {
        include: {
          // 为了获取图片，需要层层关联
          productVariant: {
            include: {
              product: {
                select: { coverImageUrl: true }
              }
            }
          }
        }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-blue-500" />
            订单管理 (Order Management)
          </h2>
          <p className="text-zinc-400 text-sm mt-1">
            追踪订单状态、管理发货流程及查看详细交易记录。
          </p>
        </div>
      </div>

      <OrderTable orders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}