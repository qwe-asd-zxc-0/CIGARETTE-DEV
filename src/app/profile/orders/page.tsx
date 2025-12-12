import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Package, Clock, Truck, ChevronRight, ShoppingBag } from "lucide-react";

// 定义状态对应的颜色和文案
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "待支付", color: "text-yellow-500 bg-yellow-500/10" },
  paid: { label: "已支付", color: "text-green-500 bg-green-500/10" },
  shipped: { label: "已发货", color: "text-blue-500 bg-blue-500/10" },
  completed: { label: "已完成", color: "text-zinc-400 bg-zinc-500/10" },
  cancelled: { label: "已取消", color: "text-red-500 bg-red-500/10" },
};

export default async function OrderHistoryPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 🔥 从数据库查询订单 (包含订单项和商品图片)
  const orders = await prisma.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          productVariant: true // 获取图片用
        }
      }
    }
  });

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
            {orders.map((order) => {
              const status = STATUS_MAP[order.status || "pending_payment"] || STATUS_MAP["pending_payment"];
              
              return (
                <div key={order.id} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-700 transition">
                  
                  {/* 订单头部 */}
                  <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-white">
                          订单号: <span className="font-mono text-zinc-400">#{order.id.slice(0, 8).toUpperCase()}</span>
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border border-white/5 ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(order.createdAt!).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">订单金额</p>
                        <p className="text-lg font-bold text-white font-mono">${Number(order.totalAmount).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* 订单商品列表 */}
                  <div className="p-6 space-y-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        <div className="relative w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden border border-white/5 flex-shrink-0">
                          {item.productVariant?.variantImageUrl && (
                            <Image 
                              src={item.productVariant.variantImageUrl} 
                              alt="product" 
                              fill 
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-zinc-200 line-clamp-1">{item.productTitleSnapshot}</p>
                          <p className="text-xs text-zinc-500">{item.flavorSnapshot}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-zinc-300 font-mono">x{item.quantity}</p>
                          <p className="text-sm font-bold text-white font-mono">${Number(item.unitPrice).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 底部操作栏 */}
                  <div className="px-6 py-4 bg-black/20 border-t border-zinc-800 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                      <Truck className="w-4 h-4" />
                      {order.trackingNumber ? `运单号: ${order.trackingNumber}` : "等待发货"}
                    </div>
                    <button className="text-sm font-bold text-white hover:text-red-500 transition flex items-center gap-1">
                      查看详情 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}