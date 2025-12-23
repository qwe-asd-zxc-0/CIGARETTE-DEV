import {NextIntlClientProvider} from 'next-intl';
import {getMessages, setRequestLocale} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { Inter } from "next/font/google";
import "../globals.css";

// ✅ 引入所有全局组件
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import FloatingCartButton from "@/components/FloatingCartButton";
import GlobalOverlay from "@/components/GlobalOverlay"; // ✅ 使用 GlobalOverlay 统一管理全局弹窗组件
import { checkSessionValidity } from "@/lib/session"; // ✅ 引入 Session 检查
import SessionGuard from "@/components/SessionGuard"; // ✅ 引入客户端处理组件

const inter = Inter({ subsets: ["latin"] });

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  // 确保 params 被正确 await (Next.js 15+ 要求)
  const { locale } = await params;

  // 启用静态渲染
  setRequestLocale(locale);

  // 验证 locale 是否合法
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
 
  // 获取所有翻译消息
  const messages = await getMessages();

  // 🛡️ 全局检查 Session 有效性
  const { valid, reason } = await checkSessionValidity();

  return (
    <html lang={locale}>
      <body className={`${inter.className} bg-black text-white antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {/* CartProvider 包裹整个应用状态 */}
          <CartProvider>
            
            {/* 0. Session 守卫 (如果无效，会自动登出并跳转) */}
            <SessionGuard isValid={valid} reason={reason} />

            {/* 1. 全局拦截与弹窗层 (使用 GlobalOverlay 统一管理，自动在后台页面隐藏) */}
            <GlobalOverlay /> {/* ✅ 包含 AgeGate、CouponPopup、ContactWidget，并在后台页面自动隐藏 */}

            {/* 2. 顶部导航 */}
            <Header />
            
            {/* 3. 页面主体内容 */}
            <main className="min-h-screen relative z-0">
              {children}
            </main>

            {/* 5. 底部 Footer */}
            <Footer />

            {/* 4. 全局悬浮组件 (Z轴层级通常较高) */}
            <CartDrawer />         {/* 右侧滑出购物车抽屉 */}
            
            {/* 悬浮按钮组 */}
            <FloatingCartButton /> {/* 🛒 购物车入口 (位置: bottom-24 right-6) */}
            
          </CartProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}