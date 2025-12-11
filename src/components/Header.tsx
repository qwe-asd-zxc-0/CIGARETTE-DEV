"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ShoppingCart, User, LogOut, Package, UserCircle, Menu } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useRouter, usePathname } from "next/navigation"; // ✅ 引入 usePathname

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname(); // ✅ 获取当前路径
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsMounted(true);
    
    // 获取用户状态
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    // 监听登录变化
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') router.refresh();
    });

    // 滚动效果
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [supabase, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // ✅ 核心修改：如果是后台页面 (/admin 开头)，直接隐藏导航栏
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // 避免服务端渲染不匹配
  if (!isMounted) return (
    <header className="fixed top-0 left-0 right-0 z-50 h-24 border-b border-transparent bg-black/80 backdrop-blur-xl flex items-center justify-center">
       {/* 占位符 */}
    </header>
  );

  const navLinks = [
    { name: "All Products", href: "/product" },
    { name: "Disposable", href: "/product?category=Disposable" },
    { name: "E-Liquid", href: "/product?category=E-Liquid" },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? "bg-black/90 backdrop-blur-xl border-white/10 shadow-xl" 
          : "bg-black/20 backdrop-blur-sm border-white/5"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-24 flex items-center justify-between relative">
        
        {/* === Logo === */}
        <Link href="/" className="flex items-center gap-2 z-20">
          <span className="text-2xl font-black text-white tracking-tighter">
            GLOBAL <span className="text-red-600">TOBACCO</span>
          </span>
        </Link>

        {/* === 桌面端导航 === */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              className={`text-sm font-bold tracking-widest uppercase transition-colors ${
                 pathname === link.href ? "text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* === 右侧功能区 (登录/注册) === */}
        <div className="flex items-center gap-4 z-20">
          <Link href="/cart" className="p-2 text-zinc-400 hover:text-white transition-colors">
            <ShoppingCart className="w-5 h-5" />
          </Link>

          {/* 分隔线 */}
          <div className="h-6 w-[1px] bg-white/20 hidden sm:block"></div>

          {user ? (
            // === 已登录：显示头像 ===
            <div className="relative group">
              <Link href="/profile" className="flex items-center gap-3 py-1.5 pl-1.5 pr-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                   <User className="w-4 h-4 text-zinc-200" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-bold text-white max-w-[80px] truncate">
                    {user.user_metadata?.full_name || "Account"}
                  </span>
                </div>
              </Link>
              {/* 下拉菜单 */}
              <div className="absolute right-0 top-full mt-2 w-56 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block">
                <div className="p-2 space-y-1">
                  <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 rounded-lg">
                    <UserCircle className="w-4 h-4" /> Settings
                  </Link>
                  <Link href="/profile/orders" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 rounded-lg">
                    <Package className="w-4 h-4" /> Orders
                  </Link>
                  <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            // === 未登录：显示按钮 ===
            <div className="flex items-center gap-3">
              <Link href="/login" className="text-xs font-bold text-white hover:text-zinc-300 uppercase tracking-wide px-2">
                Log In
              </Link>
              <Link 
                href="/sign-up" 
                className="px-5 py-2.5 text-xs font-bold bg-white text-black rounded-full hover:bg-zinc-200 uppercase tracking-wide"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}