"use client";

import { useCartDrawer } from "@/context/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { useTranslations, useLocale } from 'next-intl';
import { getTrans } from '@/lib/i18n-utils';

export default function CartPage() {
  const t = useTranslations('CartPage');
  const locale = useLocale();
  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 🛡️ 客户端双重验证：未登录直接踢走
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/cart");
      }
    };
    checkAuth();
  }, [router, supabase]);

  // ✅ 直接连接全局大脑
  const { cartItems, updateQuantity, removeFromCart } = useCartDrawer();

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Layer */}
        <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-neutral-950" />
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }}
          />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 bg-zinc-900/80 backdrop-blur-md rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
            <ShoppingBag className="w-10 h-10 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-white">{t('emptyTitle')}</h1>
          <p className="text-zinc-400 mb-8">{t('emptyDesc')}</p>
          <Link 
            href="/product" 
            className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition flex items-center gap-2 shadow-[0_0_20px_rgba(220,38,38,0.4)] hover:shadow-[0_0_30px_rgba(220,38,38,0.6)]"
          >
            {t('goShopping')} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4 md:px-8 relative overflow-hidden">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-neutral-950" />
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-screen"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517154596051-c636f31f731e?q=80&w=2000&auto=format&fit=crop')" }}
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-red-900/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90" />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        <h1 className="text-3xl font-bold mb-10 border-b border-zinc-800 pb-4">{t('title')}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 左侧：商品列表 */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                {/* 图片 */}
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image && (
                    <Image src={item.image} alt={getTrans(item.titleJson || item.title, locale)} fill className="object-cover" />
                  )}
                </div>

                {/* 信息与操作 */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white line-clamp-2 pr-4">{getTrans(item.titleJson || item.title, locale)}</h3>
                      <p className="text-lg font-mono text-red-500 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      {getTrans(item.flavorJson || item.flavor, locale)} | {item.strength}
                    </p>
                    {/* 库存提示 */}
                    <p className="text-xs text-zinc-500 mt-2">
                      {t('currentStock')}: {item.stock}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    {/* 数量控制器 */}
                    <div className="flex items-center gap-4 bg-black border border-zinc-700 rounded-lg px-3 py-1.5">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="text-zinc-400 hover:text-white disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="text-zinc-400 hover:text-white disabled:opacity-30"
                        // 🔥 核心：库存校验，如果达到库存上限，按钮变灰
                        disabled={item.quantity >= item.stock} 
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* 删除 */}
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm text-zinc-500 hover:text-red-500 flex items-center gap-1 transition"
                    >
                      <Trash2 className="w-4 h-4" /> {t('remove')}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 右侧：汇总 */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sticky top-32">
              <h2 className="text-xl font-bold mb-6">{t('orderSummary')}</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-zinc-400">
                  <span>{t('subtotal')}</span>
                  <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>{t('shipping')}</span>
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded">{t('calculatedNextStep')}</span>
                </div>
                <div className="h-px bg-zinc-800 my-4" />
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}</span>
                  <span className="text-red-500 font-mono">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white text-center font-bold rounded-xl transition shadow-lg shadow-red-900/20"
              >
                {t('checkout')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}