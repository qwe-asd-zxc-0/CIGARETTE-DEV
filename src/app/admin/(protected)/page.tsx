import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Users, ShoppingBag, CreditCard, AlertTriangle, ArrowRight, Package } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // 1. 并行获取核心指标数据
  const [
    userCount, 
    orderCount, 
    productCount, 
    lowStockCount,
    recentOrders
  ] = await Promise.all([
    prisma.profile.count(), // 总用户数
    prisma.order.count(),   // 总订单数
    prisma.product.count({ where: { status: 'active' } }), // 上架商品数
    prisma.product.count({ where: { stockQuantity: { lt: 10 }, status: 'active' } }), // 低库存预警 (少于10)
    
    // 获取最近 5 笔订单
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    })
  ]);

  // 2. 计算总销售额 (统计状态为 'completed' 或 'paid' 的订单)
  // 这里暂时统计所有非 pending_payment 的订单金额作为演示
  const salesData = await prisma.order.aggregate({
    _sum: { totalAmount: true },
    where: { 
      status: { not: 'pending_payment' } 
    } 
  });
  const totalSales = salesData._sum.totalAmount?.toString() || "0";

  // 定义统计卡片配置
  const stats = [
    { 
      label: "总销售额", 
      value: `$${totalSales}`, 
      icon: CreditCard, 
      color: "text-emerald-500", 
      bg: "bg-emerald-500/10",
      desc: "已支付/完成订单"
    },
    { 
      label: "总订单数", 
      value: orderCount, 
      icon: ShoppingBag, 
      color: "text-blue-500", 
      bg: "bg-blue-500/10",
      desc: "全平台历史订单"
    },
    { 
      label: "注册用户", 
      value: userCount, 
      icon: Users, 
      color: "text-purple-500", 
      bg: "bg-purple-500/10",
      desc: "已验证邮箱用户"
    },
    { 
      label: "库存预警", 
      value: lowStockCount, 
      icon: AlertTriangle, 
      color: "text-orange-500", 
      bg: "bg-orange-500/10",
      desc: "库存 < 10 的商品"
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 头部欢迎语 */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
          <p className="text-zinc-400">欢迎回来管理员。这是业务概览。</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-zinc-500 font-mono">
            Last updated: {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
      
      {/* --- 核心指标卡片区域 --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="group bg-zinc-900/50 border border-white/10 p-6 rounded-2xl hover:border-white/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                {/* 如果是库存预警且有数量，显示红色指示灯 */}
                {stat.label === "库存预警" && Number(stat.value) > 0 && (
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                )}
              </div>
              <p className="text-3xl font-bold text-white tracking-tight">{stat.value}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-zinc-400 text-sm font-medium">{stat.label}</p>
                <span className="text-[10px] text-zinc-600 uppercase tracking-wider">{stat.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* --- 最近订单表格 (占 2/3 宽度) --- */}
        <div className="lg:col-span-2 bg-zinc-900/50 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
          <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
            <h3 className="font-bold text-white flex items-center gap-2">
              <ClipboardListIcon className="w-5 h-5 text-blue-500" />
              最近订单
            </h3>
            <Link href="/admin/orders" className="text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
              查看全部 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-black/20 text-zinc-500 uppercase font-bold text-xs tracking-wider">
                <tr>
                  <th className="p-4 pl-6">订单号</th>
                  <th className="p-4">客户</th>
                  <th className="p-4">状态</th>
                  <th className="p-4">金额</th>
                  <th className="p-4 text-right pr-6">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentOrders.map((order) => {
                  // 解析收货地址信息
                  const address = order.shippingAddress as any || {};
                  const recipientName = address.firstName 
                    ? `${address.firstName} ${address.lastName || ''}`.trim()
                    : null;

                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                      <td className="p-4 pl-6 font-mono text-white group-hover:text-red-400 transition-colors">
                        {order.id.slice(0, 8)}...
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="text-white font-medium">
                            {recipientName || order.user?.fullName || 'Guest'}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {order.user?.email || order.guestEmail}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                        order.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                        order.status === 'paid' ? 'bg-blue-500/10 text-blue-500' :
                        order.status === 'shipped' ? 'bg-purple-500/10 text-purple-500' :
                        order.status === 'pending_payment' ? 'bg-yellow-500/10 text-yellow-500' :
                        order.status === 'cancelled' ? 'bg-red-500/10 text-red-500' :
                        'bg-zinc-800 text-zinc-400'
                      }`}>
                        {{
                          'pending_payment': '待支付',
                          'paid': '已支付',
                          'shipped': '已发货',
                          'completed': '已完成',
                          'cancelled': '已取消'
                        }[order.status || ''] || order.status}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-white">
                      ${order.totalAmount.toString()}
                    </td>
                    <td className="p-4 text-right pr-6 text-zinc-500">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                );
                })}
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-zinc-600">
                      暂无订单数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- 快捷入口 / 系统状态 (占 1/3 宽度) --- */}
        <div className="space-y-6">
          {/* 快捷操作 */}
          <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              快捷入口
            </h3>
            <div className="space-y-3">
              <Link href="/admin/products" className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-zinc-300 hover:text-white transition-all text-sm font-medium text-center">
                + 发布新商品
              </Link>
              <Link href="/admin/content" className="block w-full py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-zinc-300 hover:text-white transition-all text-sm font-medium text-center">
                审核新评论
              </Link>
            </div>
          </div>

          {/* 上架商品统计 */}
          <div className="bg-gradient-to-br from-red-900/20 to-black border border-red-500/20 rounded-2xl p-6">
            <h3 className="text-zinc-400 text-sm font-medium mb-1">商品</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-white">{productCount}</span>
              <span className="text-sm text-red-400">已上架</span>
            </div>
            <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-600 w-3/4 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 辅助图标组件，避免重复引入导致代码冗余
function ClipboardListIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  )
}