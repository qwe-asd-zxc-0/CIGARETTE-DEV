// src/app/cart/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { getCart, removeFromCart, updateQuantity, CartItem } from "@/lib/cart";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  const refreshCart = () => setCart(getCart());

  useEffect(() => {
    setMounted(true);
    refreshCart();
    
    window.addEventListener('cart-updated', refreshCart);
    return () => window.removeEventListener('cart-updated', refreshCart);
  }, []);

  if (!mounted) return null;

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <div className="min-h-screen bg-black pt-32 pb-20 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-3">
          <ShoppingBag className="w-8 h-8" /> 我的购物车
        </h1>

        {cart.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
            <p className="text-zinc-500 mb-6">您的购物车是空的。</p>
            <Link href="/product" className="px-6 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 transition">
              去逛逛
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* 左侧：商品列表 */}
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div key={item.variantId} className="flex gap-4 p-4 bg-zinc-900/50 border border-white/5 rounded-xl">
                  {/* 商品图片 */}
                  <div className="w-24 h-24 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  
                  {/* 商品信息 */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-white line-clamp-1">{item.title}</h3>
                        <span className="font-mono text-white">${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1">
                        {item.flavor} · {item.strength}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-4">
                      {/* 数量加减 */}
                      <div className="flex items-center bg-zinc-950 border border-white/10 rounded-lg h-8">
                        <button onClick={() => updateQuantity(item.variantId, -1)} className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white"><Minus className="w-3 h-3" /></button>
                        <span className="w-8 text-center text-xs font-mono text-white">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.variantId, 1)} className="w-8 h-full flex items-center justify-center text-zinc-400 hover:text-white"><Plus className="w-3 h-3" /></button>
                      </div>
                      
                      {/* 删除按钮 */}
                      <button onClick={() => removeFromCart(item.variantId)} className="text-zinc-500 hover:text-red-500 transition" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* 右侧：结算卡片 */}
            <div className="lg:col-span-1">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 sticky top-32">
                <h3 className="text-lg font-bold text-white mb-6">订单摘要</h3>
                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-zinc-400">
                    <span>商品小计</span>
                    <span className="text-white font-mono">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>运费</span>
                    <span className="text-white">结算时计算</span>
                  </div>
                </div>
                
                <div className="border-t border-white/10 pt-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">总计</span>
                    <span className="text-2xl font-black text-white tracking-tight">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button 
                  onClick={() => router.push("/checkout")}
                  className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl flex items-center justify-center gap-2 transition group"
                >
                  去结算 <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}