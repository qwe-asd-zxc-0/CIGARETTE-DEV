"use client";

import { Link, useRouter, usePathname } from "@/i18n/routing"; // ✅ 使用国际化路由组件
import { useState, useEffect } from "react";
import { ShoppingCart, User, LogOut, Package, UserCircle, Menu, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useCartDrawer } from "@/context/CartContext"; // ✅ 引入购物车 Context
import { getHeaderProfile } from "@/app/actions";
import LanguageSwitcher from "./LanguageSwitcher"; // ✅ 引入语言切换器
import { useTranslations } from 'next-intl'; // ✅ 引入翻译钩子

export default function Header() {
  const t = useTranslations('Navigation'); // ✅ 获取 Navigation 命名空间的翻译
  const tCommon = useTranslations('Common'); // ✅ 获取 Common 命名空间的翻译
  const [user, setUser] = useState<any>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // 📱 移动端菜单状态

  const router = useRouter();
  const pathname = usePathname();
  const { openCart } = useCartDrawer(); // ✅ 获取打开购物车的方法

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setIsMounted(true);

    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        router.refresh();
        setIsMobileMenuOpen(false); // 登出时关闭菜单
        setProfileName(null);
      }
    });

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener("scroll", handleScroll);
    };
  }, [supabase, router]);

  // ✅ 监听用户变化，获取最新 Profile 名字
  useEffect(() => {
    if (user) {
      getHeaderProfile().then((p) => {
        if (p?.fullName) setProfileName(p.fullName);
      });
    }
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // 后台页面隐藏 Header
  if (pathname?.startsWith("/admin")) return null;

  if (!isMounted) return (
    <header className="fixed top-0 left-0 right-0 z-50 h-24 bg-black/80 backdrop-blur-xl" />
  );

  const navLinks = [
    { name: t('products'), href: "/product" },
    { name: t('disposable'), href: "/product?category=Disposable" },
    { name: t('eliquid'), href: "/product?category=E-Liquid" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-black/90 backdrop-blur-xl border-white/10 shadow-xl h-20"
            : "bg-transparent border-white/5 h-24"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-full flex items-center justify-between relative">
          
          {/* === 1. 移动端菜单按钮 (左侧) === */}
          <button 
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* === 2. Logo (居中或左侧) === */}
          <Link href="/" className="flex items-center gap-2 z-20">
            <span className="text-2xl font-black text-white tracking-tighter">
              GLOBAL <span className="text-red-600">TOBACCO</span>
            </span>
          </Link>

          {/* === 3. 桌面端导航 (居中) === */}
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

          {/* === 4. 右侧功能区 === */}
          <div className="flex items-center gap-4 z-20 ml-auto">
            {/* 🌍 语言切换器 */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>

            {/* 🛒 购物车按钮 (触发抽屉) */}
            <button 
              onClick={openCart} 
              className="p-2 text-zinc-400 hover:text-white transition-colors relative group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {/* 可选：这里可以加个小红点显示数量 */}
            </button>

            <div className="h-6 w-[1px] bg-white/20 hidden sm:block"></div>

            {/* 用户状态 */}
            {user ? (
              <div className="relative group hidden sm:block">
                <Link href="/profile" className="flex items-center gap-3 py-1.5 pl-1.5 pr-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-all">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/10">
                    <User className="w-4 h-4 text-zinc-200" />
                  </div>
                  <span className="text-xs font-bold text-white max-w-[80px] truncate">
                    {profileName || user.user_metadata?.full_name || "账户"}
                  </span>
                </Link>
                
                {/* 下拉菜单 */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block pt-2">
                  <div className="p-1 space-y-1 bg-zinc-950">
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 rounded-lg">
                      <UserCircle className="w-4 h-4" /> 账户设置
                    </Link>
                    <Link href="/profile/orders" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 rounded-lg">
                      <Package className="w-4 h-4" /> 我的订单
                    </Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
                      <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/login" className="text-xs font-bold text-white hover:text-zinc-300 uppercase tracking-wide px-2">
                  登录
                </Link>
                <Link
                  href="/sign-up"
                  className="px-5 py-2.5 text-xs font-bold bg-white text-black rounded-full hover:bg-zinc-200 uppercase tracking-wide transition-transform hover:scale-105"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* === 📱 移动端全屏菜单 === */}
      <div 
        className={`fixed inset-0 z-[60] bg-zinc-950 transition-transform duration-300 md:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <span className="text-xl font-black text-white">菜单</span>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* 移动端语言切换 */}
          <div className="mb-4">
            <LanguageSwitcher />
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-2xl font-bold text-white uppercase tracking-wider"
            >
              {link.name}
            </Link>
          ))}

          <hr className="border-white/10 my-4" />

          {user ? (
            <>
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-zinc-300 flex items-center gap-3">
                <UserCircle className="w-5 h-5" /> 账户设置
              </Link>
              <Link href="/profile/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-lg text-zinc-300 flex items-center gap-3">
                <Package className="w-5 h-5" /> 我的订单
              </Link>
              <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="text-lg text-red-400 flex items-center gap-3 text-left">
                <LogOut className="w-5 h-5" /> 退出登录
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-4 mt-4">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center border border-white/20 rounded-lg text-white font-bold uppercase">
                登录
              </Link>
              <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 text-center bg-white text-black rounded-lg font-bold uppercase">
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}