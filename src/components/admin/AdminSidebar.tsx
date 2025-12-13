"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Users, ShoppingBag, Box, ClipboardList, 
  MessageSquare, Settings, BarChart3, LogOut, Home 
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";

const menuItems = [
  { name: "数据看板", href: "/admin", icon: BarChart3 },
  { name: "用户管理", href: "/admin/users", icon: Users },
  { name: "商品管理", href: "/admin/products", icon: ShoppingBag },
  { name: "库存管理", href: "/admin/inventory", icon: Box },
  { name: "订单管理", href: "/admin/orders", icon: ClipboardList },
  { name: "内容管理", href: "/admin/content", icon: MessageSquare },
  { name: "系统配置", href: "/admin/settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/admin/login");
  };

  return (
    <aside className="w-64 bg-zinc-900 border-r border-white/10 min-h-screen flex flex-col fixed left-0 top-0 bottom-0 z-50">
      {/* Logo 区域 */}
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white tracking-wider">
          GLOBAL <span className="text-red-600">ADMIN</span>
        </h1>
        <Link href="/" title="返回前台首页" className="text-zinc-500 hover:text-white transition-colors">
          <Home className="w-5 h-5" />
        </Link>
      </div>
      
      {/* 导航菜单 */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${
                isActive 
                  ? "bg-red-600 text-white shadow-lg shadow-red-900/20" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 底部退出按钮 */}
      <div className="p-4 border-t border-white/10 bg-zinc-900">
        <button 
          onClick={handleSignOut}
          className="flex items-center gap-3 px-4 py-3 w-full text-zinc-400 hover:text-red-500 transition-colors rounded-xl hover:bg-white/5 text-sm font-medium"
        >
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </aside>
  );
}