import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
// ✅ 引入 MapPin 图标
import { User, Mail, ShieldCheck, Wallet, Package, Clock, LogOut, MapPin } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login"); // 未登录强踢

  // 获取 Prisma 数据库中的完整资料
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    include: { _count: { select: { orders: true } } }
  });

  return (
    <div className="min-h-screen bg-black pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">我的账户</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* 左侧：个人信息卡片 */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 text-center">
              <div className="w-20 h-20 bg-zinc-800 rounded-full mx-auto flex items-center justify-center border-2 border-zinc-700 mb-4">
                 <User className="w-8 h-8 text-zinc-400" />
              </div>
              <h2 className="text-xl font-bold text-white">{profile?.fullName || "尊贵会员"}</h2>
              <p className="text-zinc-500 text-sm mt-1 mb-4">{user.email}</p>
              
              {profile?.isAgeVerified && (
                 <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-900/30 text-green-400 text-xs font-bold border border-green-500/20">
                    <ShieldCheck className="w-3 h-3" /> 已实名认证
                 </div>
              )}
            </div>

            {/* 快捷菜单 */}
            <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
               <Link href="/profile/orders" className="flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5">
                  <Package className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-200">历史订单</span>
               </Link>
               
               {/* 🔥 新增：地址管理入口 */}
               <Link href="/profile/addresses" className="flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors border-b border-white/5">
                  <MapPin className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-200">收货地址管理</span>
               </Link>

               <Link href="/profile/settings" className="flex items-center gap-3 px-6 py-4 hover:bg-white/5 transition-colors">
                  <User className="w-4 h-4 text-zinc-400" />
                  <span className="text-sm font-medium text-zinc-200">账户设置</span>
               </Link>
            </div>
          </div>

          {/* 右侧：数据看板 */}
          <div className="md:col-span-2 space-y-6">
             {/* 余额卡片 */}
             <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 rounded-2xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="relative z-10">
                   <div className="flex items-center gap-2 text-zinc-400 text-sm font-bold uppercase tracking-wider mb-2">
                      <Wallet className="w-4 h-4" /> 可用余额
                   </div>
                   <div className="text-5xl font-mono font-bold text-white mb-6">
                      ${Number(profile?.balance || 0).toFixed(2)}
                   </div>
                   <div className="flex gap-3">
                      <button className="px-4 py-2 bg-white text-black font-bold text-sm rounded-lg hover:bg-zinc-200 transition-colors">
                         充值
                      </button>
                      <button className="px-4 py-2 bg-white/10 text-white font-bold text-sm rounded-lg hover:bg-white/20 transition-colors">
                         查看交易记录
                      </button>
                   </div>
                </div>
             </div>

             {/* 统计数据 */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                   <Package className="w-6 h-6 text-zinc-500 mb-3" />
                   <div className="text-2xl font-bold text-white">{profile?._count.orders || 0}</div>
                   <div className="text-sm text-zinc-500">累计订单</div>
                </div>
                <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
                   <Clock className="w-6 h-6 text-zinc-500 mb-3" />
                   <div className="text-2xl font-bold text-white">
                      {new Date(user.created_at).toLocaleDateString()}
                   </div>
                   <div className="text-sm text-zinc-500">注册时间</div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}