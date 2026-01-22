"use client";

import { Link, useRouter, usePathname } from "@/i18n/routing";
import { useState, useEffect } from "react";
import { ShoppingCart, Menu, X, Search } from "lucide-react"; // ✅ 只保留需要的图标
import { useCartDrawer } from "@/context/CartContext";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslations } from 'next-intl';
import { useSearchParams } from "next/navigation";

export default function Header() {
  const t = useTranslations('Navigation');
  // const tCommon = useTranslations('Common'); // 暂时用不到，因为直接写了中文 "查询订单"

  // ✅ 状态精简：只保留 UI 相关的状态
  const [isMounted, setIsMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");
  
  const { openCart } = useCartDrawer();

  useEffect(() => {
    setIsMounted(true);

    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // 后台页面隐藏 Header
  if (pathname?.startsWith("/admin")) return null;

  // 避免服务端渲染不匹配
  if (!isMounted) return (
    <header className="fixed top-0 left-0 right-0 z-50 h-24 bg-zinc-950/80 backdrop-blur-xl" />
  );

  const navLinks = [
    { name: t('home'), href: "/" },
    { name: t('products'), href: "/product" },
    { name: t('traditional'), href: "/product?category=Traditional" },
    { name: t('disposable'), href: "/product?category=Disposable" },
    { name: t('eliquid'), href: "/product?category=E-Liquid" },
    { name: t('accessories'), href: "/product?category=Accessories" },
  ];

  // 判断链接是否激活
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
            ? "bg-zinc-950/80 backdrop-blur-xl border-white/10 shadow-2xl h-20 supports-[backdrop-filter]:bg-zinc-950/60"
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
             {/* 如果有 Logo 图片放这里 */}
             {/* <span className="text-2xl font-black text-white tracking-tighter">GLOBAL TOBACCO</span> */}
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
            {/* 🛒 购物车按钮 */}
            <button 
              onClick={openCart} 
              className="p-2 text-zinc-400 hover:text-white transition-colors relative group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            <div className="h-6 w-[1px] bg-white/20 hidden sm:block"></div>

            {/* ✅ 桌面端：游客查单入口 (中文) */}
            <Link 
              href="/track-order" 
              className="hidden sm:flex items-center gap-2 text-sm font-bold text-zinc-400 hover:text-white transition-colors group"
            >
              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                <Search className="w-4 h-4" />
              </div>
              <span className="uppercase tracking-wide">查询订单</span>
            </Link>

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
        className={`fixed inset-y-0 left-0 z-[60] w-[80%] max-w-sm bg-zinc-900/95 backdrop-blur-xl border-r border-white/10 shadow-2xl transition-transform duration-300 lg:hidden flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <Link href="/" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-2">
             {/* Logo Placeholder */}
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

          {/* ✅ 移动端：查询订单按钮 (中文) */}
          <div className="mt-auto">
            <Link 
              href="/track-order" 
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full py-3 flex items-center justify-center gap-2 border border-white/20 rounded-lg text-white text-sm font-bold uppercase hover:bg-white/5 transition-colors"
            >
              <Search className="w-5 h-5" />
              查询订单
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}