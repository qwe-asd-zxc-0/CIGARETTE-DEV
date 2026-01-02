"use client";

import { Link, useRouter, usePathname } from "@/i18n/routing"; // ✅ 使用国际化路由组件
import { useState, useEffect } from "react";
import { ShoppingCart, User, LogOut, Package, UserCircle, Menu, X } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useCartDrawer } from "@/context/CartContext"; // ✅ 引入购物车 Context
import { getHeaderProfile } from "@/app/actions";
import LanguageSwitcher from "./LanguageSwitcher"; // ✅ 引入语言切换器
import { useTranslations } from 'next-intl'; // ✅ 引入翻译钩子
import { useSearchParams } from "next/navigation"; // ✅ 引入查询参数钩子

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
  const searchParams = useSearchParams(); // ✅ 获取查询参数
  const currentCategory = searchParams.get("category");
  
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
    { name: t('home'), href: "/" },
    { name: t('products'), href: "/product" },
    { name: t('traditional'), href: "/product?category=Traditional" },
    { name: t('disposable'), href: "/product?category=Disposable" },
    { name: t('eliquid'), href: "/product?category=E-Liquid" },
    { name: t('accessories'), href: "/product?category=Accessories" },
  ];

  // ✅ 判断链接是否激活
  const isActive = (href: string) => {
    if (href === "/" && pathname === "/") return true;
    if (href === "/product" && pathname === "/product" && !currentCategory) return true;
    if (href.includes("?category=")) {
      const category = href.split("?category=")[1];
      return currentCategory === category;
    }
    return false;
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-black/90 backdrop-blur-xl border-white/10 shadow-xl h-20"
            : "bg-transparent border-white/5 h-24"
        }`}
      >
        <div className="w-full max-w-[1600px] mx-auto px-4 md:px-8 h-full flex items-center justify-between relative">
          
          {/* === 1. 移动端菜单按钮 (左侧) === */}
          <button 
            className="lg:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* === 2. Logo (居中或左侧) === */}
          <Link href="/" className="flex items-center gap-2 z-20 flex-shrink-0">
            <span className="text-2xl font-black text-white tracking-tighter">
              GLOBAL <span className="text-red-600">TOBACCO</span>
            </span>
          </Link>

          {/* === 3. 桌面端导航 (居中) === */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-8 absolute left-1/2 -translate-x-1/2 w-max max-w-[60%] justify-center">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-xs xl:text-sm font-bold tracking-widest uppercase transition-colors whitespace-nowrap ${
                    active ? "text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* === 4. 右侧功能区 === */}
          <div className="flex items-center gap-4 z-20 ml-auto flex-shrink-0">
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
                    {profileName || user.user_metadata?.full_name || tCommon('profile')}
                  </span>
                </Link>
                
                {/* 下拉菜单 */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden hidden group-hover:block pt-2">
                  <div className="p-1 space-y-1 bg-zinc-950">
                    <Link href="/profile" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 rounded-lg">
                      <UserCircle className="w-4 h-4" /> {tCommon('profile')}
                    </Link>
                    <Link href="/profile/orders" className="flex items-center gap-3 px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 rounded-lg">
                      <Package className="w-4 h-4" /> {tCommon('orders')}
                    </Link>
                    <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
                      <LogOut className="w-4 h-4" /> {tCommon('logout')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <Link href="/login" className="text-xs font-bold text-white hover:text-zinc-300 uppercase tracking-wide px-2">
                  {tCommon('login')}
                </Link>
                <Link
                  href="/sign-up"
                  className="px-5 py-2.5 text-xs font-bold bg-white text-black rounded-full hover:bg-zinc-200 uppercase tracking-wide transition-transform hover:scale-105"
                >
                  {tCommon('signup')}
                </Link>
              </div>
            )}

            {/* 🌍 语言切换器 */}
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      {/* === 📱 移动端菜单 (侧边抽屉 + 背景遮罩) === */}
      {/* 背景遮罩 */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 侧边抽屉 */}
      <div 
        className={`fixed inset-y-0 left-0 z-[60] w-[80%] max-w-sm bg-zinc-950 border-r border-white/10 shadow-2xl transition-transform duration-300 lg:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tighter">
              GLOBAL <span className="text-red-600">TOBACCO</span>
            </span>
          </Link>
          <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-zinc-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {/* 移动端语言切换 */}
          <div className="mb-2">
            <LanguageSwitcher />
          </div>

          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-lg font-bold uppercase tracking-wider ${
                  active ? "text-white" : "text-zinc-500"
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <hr className="border-white/10 my-2" />

          {user ? (
            <>
              <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="text-base text-zinc-300 flex items-center gap-3">
                <UserCircle className="w-5 h-5" /> {tCommon('profile')}
              </Link>
              <Link href="/profile/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-base text-zinc-300 flex items-center gap-3">
                <Package className="w-5 h-5" /> {tCommon('orders')}
              </Link>
              <button onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }} className="text-base text-red-400 flex items-center gap-3 text-left">
                <LogOut className="w-5 h-5" /> {tCommon('logout')}
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-3 mt-2">
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 text-center border border-white/20 rounded-lg text-white text-sm font-bold uppercase">
                {tCommon('login')}
              </Link>
              <Link href="/sign-up" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-3 text-center bg-white text-black rounded-lg text-sm font-bold uppercase">
                {tCommon('signup')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}