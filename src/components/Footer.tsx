"use client";

import { usePathname } from "@/i18n/routing"; // ✅ 使用国际化路由
import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { useTranslations } from 'next-intl'; // ✅ 引入翻译钩子

export default function Footer() {
  const pathname = usePathname();
  const t = useTranslations('Footer'); // ✅ 获取 Footer 翻译
  const tNav = useTranslations('Navigation'); // ✅ 获取 Navigation 翻译

  // 1. 定义不需要显示 Footer 的路径特征
  // - 所有以 /admin 开头的路径
  // - 登录和注册页面
  const isHidden = pathname?.startsWith("/admin") || 
                   pathname === "/login" || 
                   pathname === "/sign-up" ||
                   pathname === "/admin/login";

  if (isHidden) {
    return null;
  }

  return (
    <footer className="bg-zinc-900 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Global Tobacco</h3>
            <div className="text-zinc-400 text-sm leading-relaxed space-y-1">
              <p className="font-medium text-zinc-300">{t('brandDesc')}</p>
              <p>{t('brandSlogan')}</p>
            </div>
            <div className="flex gap-4">
              <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="text-zinc-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-6">{t('quickLinks')}</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/" className="hover:text-white transition-colors">{tNav('home')}</Link></li>
              <li><Link href="/product" className="hover:text-white transition-colors">{tNav('products')}</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">{tNav('cart')}</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">{tNav('cart')}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-6">{t('legal')}</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/terms" className="hover:text-white transition-colors">{t('terms')}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{t('privacy')}</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">{t('refund')}</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white transition-colors">{t('shipping')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">{t('contact')}</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-zinc-500 shrink-0" />
                <span>123 Vape Street, Smoke City, SC 12345, USA</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-zinc-500 shrink-0" />
                <span>+1 (555) 123-4567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-zinc-500 shrink-0" />
                <span>support@globaltobacco.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Global Tobacco. {t('rights')}</p>
          <p>{t('warning')}</p>
        </div>
      </div>
    </footer>
  );
}
