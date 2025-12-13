"use client";

import { useCartDrawer } from "@/context/CartContext";
import { X, Minus, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function CartDrawer() {
  // ✅ 直接从 Context 获取所有数据和方法
  const { isOpen, closeCart, cartItems, removeFromCart, updateQuantity } = useCartDrawer();

  // 计算总价
  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <>
      {/* 背景遮罩 */}
      <div
        className={`fixed inset-0 bg-black/60 z-[99] transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* 抽屉主体 */}
      <div
        className={`fixed inset-y-0 right-0 z-[100] w-full max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* 1. 头部 */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-bold text-white">我的购物车 ({cartItems.length})</h2>
            <button onClick={closeCart} className="p-2 text-zinc-400 hover:text-white transition">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 2. 商品列表区 */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {cartItems.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-500 mb-4">您的购物车是空的</p>
                <Link href="/product" onClick={closeCart} className="text-red-500 hover:text-red-400 font-medium">
                  去选购商品 &gt;
                </Link>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 group">
                  {/* 图片 */}
                  <div className="relative w-20 h-20 bg-zinc-800 rounded-md overflow-hidden flex-shrink-0 border border-zinc-700">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-white font-medium line-clamp-1">{item.title}</h3>
                      <p className="text-sm text-zinc-400">
                        {item.flavor} <span className="mx-1">|</span> {item.strength}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-red-500 font-bold">${item.price}</p>

                      {/* 数量控制器 */}
                      <div className="flex items-center gap-3 bg-black border border-zinc-700 rounded px-2 py-1">
                        <button 
                          onClick={() => updateQuantity(item.id, -1)}
                          className="text-zinc-400 hover:text-white disabled:opacity-30"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm text-white font-mono w-4 text-center">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, 1)}
                          className="text-zinc-400 hover:text-white disabled:opacity-30"
                          // 🔥 视觉反馈：如果达到库存上限，加号变灰
                          disabled={item.quantity >= item.stock} 
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      
                      {/* 删除按钮 */}
                      <button 
                        onClick={() => removeFromCart(item.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 3. 底部结算区 */}
          {cartItems.length > 0 && (
            <div className="p-6 border-t border-zinc-800 bg-zinc-950">
              <div className="flex justify-between mb-4 text-zinc-300">
                <span>Subtotal</span>
                <span className="text-xl font-bold text-white">${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-xs text-zinc-500 mb-6">Tax included. Shipping calculated at checkout.</p>

              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full bg-red-600 hover:bg-red-700 text-white text-center font-bold py-4 rounded-lg transition-colors shadow-lg shadow-red-900/20"
              >
                立即结算 (Checkout)
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}