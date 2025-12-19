import Link from "next/link";
import { Facebook, Instagram, Twitter, Mail, MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-900 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Global Tobacco</h3>
            <div className="text-zinc-400 text-sm leading-relaxed space-y-1">
              <p className="font-medium text-zinc-300">Connecting the world&apos;s finest flavors.</p>
              <p>全球正品购货 · 国际极速发货 · 100% 正品保障</p>
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
            <h4 className="text-white font-bold mb-6">快速链接</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/" className="hover:text-white transition-colors">首页</Link></li>
              <li><Link href="/category" className="hover:text-white transition-colors">全部商品</Link></li>
              <li><Link href="/profile" className="hover:text-white transition-colors">我的账户</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">购物车</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-bold mb-6">法律与支持</h4>
            <ul className="space-y-3 text-sm text-zinc-400">
              <li><Link href="/terms" className="hover:text-white transition-colors">服务条款 (Terms)</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">隐私政策 (Privacy)</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white transition-colors">退款政策 (Refund)</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white transition-colors">运输政策 (Shipping)</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-bold mb-6">联系我们</h4>
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
          <p>&copy; {new Date().getFullYear()} Global Tobacco. 保留所有权利。</p>
          <p>警告：本产品含有尼古丁。尼古丁是一种成瘾性化学物质。</p>
        </div>
      </div>
    </footer>
  );
}
