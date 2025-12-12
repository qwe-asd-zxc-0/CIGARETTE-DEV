"use client";

import { useCartDrawer } from "@/context/CartContext";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartPage() {
  // ✅ 直接连接全局大脑
  const { cartItems, updateQuantity, removeFromCart } = useCartDrawer();

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white pt-32 pb-20 px-6 flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-bold mb-4">您的购物车是空的</h1>
        <p className="text-zinc-400 mb-8">看起来您还没有添加任何商品。</p>
        <Link 
          href="/product" 
          className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold transition flex items-center gap-2"
        >
          去逛逛 <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-10 border-b border-zinc-800 pb-4">我的购物车</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* 左侧：商品列表 */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-6 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                {/* 图片 */}
                <div className="relative w-24 h-24 md:w-32 md:h-32 bg-zinc-800 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image && (
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  )}
                </div>

                {/* 信息与操作 */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white line-clamp-2 pr-4">{item.title}</h3>
                      <p className="text-lg font-mono text-red-500 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <p className="text-sm text-zinc-400 mt-1">
                      {item.flavor} | {item.strength}
                    </p>
                    {/* 库存提示 */}
                    <p className="text-xs text-zinc-500 mt-2">
                      当前库存: {item.stock}
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
                      <Trash2 className="w-4 h-4" /> 删除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 右侧：汇总 */}
          <div className="lg:col-span-1">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sticky top-32">
              <h2 className="text-xl font-bold mb-6">订单汇总</h2>
              
              <div className="space-y-4 mb-8">
                <div className="flex justify-between text-zinc-400">
                  <span>小计</span>
                  <span className="text-white font-mono">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>运费</span>
                  <span className="text-xs bg-zinc-800 px-2 py-1 rounded">下一步计算</span>
                </div>
                <div className="h-px bg-zinc-800 my-4" />
                <div className="flex justify-between text-lg font-bold">
                  <span>总计</span>
                  <span className="text-red-500 font-mono">${subtotal.toFixed(2)}</span>
                </div>
              </div>

              <Link 
                href="/checkout"
                className="block w-full py-4 bg-red-600 hover:bg-red-700 text-white text-center font-bold rounded-xl transition shadow-lg shadow-red-900/20"
              >
                前往结算 (Checkout)
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}