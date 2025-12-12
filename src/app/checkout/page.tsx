// src/app/checkout/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getCart, CartItem, clearCart } from "@/lib/cart";
import { useRouter } from "next/navigation";
import { Lock, ArrowLeft, Loader2, MapPin, Mail, User } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const items = getCart();
    if (items.length === 0) router.replace("/cart");
    setCart(items);
  }, [router]);

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 模拟API请求
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    clearCart();
    alert("订单支付成功！");
    router.push("/profile/orders");
  };

  return (
    <div className="min-h-screen bg-black text-white grid grid-cols-1 lg:grid-cols-2">
      
      {/* === 左侧：订单摘要与图片展示区 (根据要求放在左侧) === */}
      <div className="relative bg-zinc-900/30 border-r border-white/5 p-6 md:p-12 lg:p-20 order-1 lg:order-1">
        <div className="max-w-md ml-auto sticky top-12">
           
           <div className="mb-8">
             <Link href="/cart" className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition text-sm">
               <ArrowLeft className="w-4 h-4" /> 返回购物车
             </Link>
           </div>

           <h2 className="text-xl font-bold mb-6 text-zinc-200">订单内容</h2>
           
           {/* 商品列表 */}
           <div className="space-y-4 mb-8">
             {cart.map(item => (
               <div key={item.variantId} className="flex gap-4 items-center">
                 <div className="relative w-16 h-16 bg-zinc-800 rounded-lg overflow-hidden border border-white/10 group">
                   <img src={item.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                   <span className="absolute top-0 right-0 bg-zinc-700 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-bl-md font-mono font-bold">
                     {item.quantity}
                   </span>
                 </div>
                 <div className="flex-1">
                   <p className="font-bold text-sm text-zinc-200 line-clamp-1">{item.title}</p>
                   <p className="text-xs text-zinc-500">{item.flavor} / {item.strength}</p>
                 </div>
                 <span className="font-mono text-sm text-zinc-300">${(item.price * item.quantity).toFixed(2)}</span>
               </div>
             ))}
           </div>
           
           {/* 金额明细 */}
           <div className="border-t border-white/10 pt-6 space-y-3">
             <div className="flex justify-between text-sm text-zinc-400">
               <span>商品小计</span>
               <span>${total.toFixed(2)}</span>
             </div>
             <div className="flex justify-between text-sm text-zinc-400">
               <span>配送费</span>
               <span className="text-green-500">免运费</span>
             </div>
           </div>
           
           <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
              <span className="text-lg font-bold">应付总额</span>
              <span className="text-3xl font-black tracking-tight text-white">${total.toFixed(2)}</span>
           </div>
        </div>
      </div>

      {/* === 右侧：结算表单区 (根据要求放在右侧) === */}
      <div className="p-6 md:p-12 lg:p-20 order-2 lg:order-2 bg-black">
        <div className="max-w-lg mr-auto">
          
          <div className="flex items-center gap-2 mb-8 text-zinc-500">
            <span className="text-white font-bold">收货信息</span>
            <span>/</span>
            <span>支付方式</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-8 text-white">收货详情</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">姓氏</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input required placeholder="Last Name" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition text-sm" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1">名字</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                  <input required placeholder="First Name" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition text-sm" />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">电子邮箱</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input required placeholder="email@example.com" type="email" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">配送地址</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-zinc-500" />
                <input required placeholder="Street Address" className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">城市</label>
                 <input required placeholder="City" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition text-sm" />
               </div>
               <div className="space-y-2">
                 <label className="text-xs font-bold text-zinc-500 uppercase ml-1">邮政编码</label>
                 <input required placeholder="Postal Code" className="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 focus:ring-1 focus:ring-white/30 transition text-sm" />
               </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 mt-8 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lock className="w-4 h-4" />}
              {loading ? "支付处理中..." : `立即支付 $${total.toFixed(2)}`}
            </button>
          </form>

          <p className="mt-8 text-xs text-zinc-600 leading-relaxed">
            点击支付即表示您同意我们的服务条款和隐私政策。所有交易均经过加密保护。
          </p>
        </div>
      </div>

    </div>
  );
}