import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import OrderCard from "@/components/OrderCard";

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 查询数据
  const rawOrders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true 
        }
      }
    }
  });

  // ✅ 核心修复：彻底的数据清洗
  const orders = rawOrders.map(order => ({
    ...order,
    // 1. 将所有 Decimal 转为 Number
    subtotalAmount: Number(order.subtotalAmount), // 之前可能漏了这个
    shippingCost: order.shippingCost ? Number(order.shippingCost) : 0, // 之前可能漏了这个
    totalAmount: Number(order.totalAmount),
    
    // 2. 处理日期
    createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
    
    // 3. 处理 Json 字段 (Prisma 查出来可能是 JsonValue，为了安全强转为 any 或 object)
    shippingAddress: order.shippingAddress || {}, 

    // 4. 处理嵌套的 items
    items: order.items.map(item => ({
      ...item,
      // Item 里的 Decimal 也要转
      unitPrice: Number(item.unitPrice),
      // 数据库里没有 totalPrice 字段，如果有也需要转
      // totalPrice: item.totalPrice ? Number(item.totalPrice) : 0, 
      
      // 处理 Item 里的商品信息
      product: item.product ? {
        ...item.product,
        basePrice: item.product.basePrice ? Number(item.product.basePrice) : 0
      } : null
    }))
  }));

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">我的订单</h1>
        </div>

        {/* 订单列表 */}
        {orders.length === 0 ? (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-12 text-center">
            <div className="w-20 h-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-600">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">暂无订单记录</h3>
            <p className="text-zinc-500 mb-8">您还没有购买过任何商品，快去选购吧！</p>
            <Link href="/product" className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition">
              去购物
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}