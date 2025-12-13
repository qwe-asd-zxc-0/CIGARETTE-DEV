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
          productVariant: true 
        }
      }
    }
  });

  // 数据转换
  const orders = rawOrders.map(order => ({
    ...order,
    totalAmount: Number(order.totalAmount),
    createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    // ✅ 加回 updatedAt (如果有值就转字符串，没有就是 null)
    updatedAt: order.updatedAt ? order.updatedAt.toISOString() : null,
    // 确保 shippingAddress 是对象 (Prisma 取出来可能是 null)
    shippingAddress: order.shippingAddress || {}, 
    items: order.items.map(item => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    }))
  }));

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition text-zinc-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-3xl font-bold text-white">我的订单</h1>
        </div>

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