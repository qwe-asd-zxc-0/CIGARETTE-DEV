import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// ✅ 引入所有全局组件
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import CartDrawer from "@/components/CartDrawer";
import FloatingCartButton from "@/components/FloatingCartButton";
import GlobalOverlay from "@/components/GlobalOverlay"; // ✅ 使用 GlobalOverlay 统一管理全局弹窗组件

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Global Tobacco",
  description: "Premium Vapes & E-Liquids",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-black text-white antialiased`}>
        {/* CartProvider 包裹整个应用状态 */}
        <CartProvider>
          
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
      </body>
    </html>
  );
}