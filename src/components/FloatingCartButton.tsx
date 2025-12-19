'use client';

import { useCartDrawer } from '@/context/CartContext';
// 确保您安装了 lucide-react (npm install lucide-react)
import { ShoppingBag } from 'lucide-react'; 
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function FloatingCartButton() {
  const { toggleCart, isOpen } = useCartDrawer();
  const [cartCount, setCartCount] = useState(0);
  const pathname = usePathname();

  // 监听购物车数量变化 (模拟逻辑，实际应从 CartContext 获取 items)
  useEffect(() => {
    // 这里简单演示：每当抽屉打开时，重新读取一下数量
    // 实际项目中，cartItems 应该在 Context 里管理，这里直接读 Context 即可
    const items = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartCount(items.reduce((acc: number, item: any) => acc + item.quantity, 0));
  }, [isOpen]);

  // 如果是后台页面或登录/注册页面，不显示悬浮购物车按钮
  if (pathname?.startsWith('/admin') || pathname === '/login' || pathname === '/sign-up') return null;

  return (
    <button
      onClick={toggleCart}
      // ✅ 核心修改：将 bottom-6 改为 bottom-24 (或者 bottom-28)
      // 这样它就会位于“联系我们”按钮的上方，互不遮挡
      className="fixed bottom-24 right-6 z-40 flex items-center justify-center w-14 h-14 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 group"
      aria-label="Open Cart"
    >
      <div className="relative">
        {/* 图标 */}
        <ShoppingBag className="w-6 h-6" />
        
        {/* 数量角标 (只有数量 > 0 时才显示) */}
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-white text-red-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-red-600">
            {cartCount}
          </span>
        )}
      </div>
      
      {/* 悬浮提示文字 (鼠标放上去时显示中文“购物车”) */}
      <span className="absolute right-full mr-3 bg-zinc-900 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        购物车
      </span>
    </button>
  );
}