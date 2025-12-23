"use client";

import { useState } from "react";
import { ShoppingCart, Zap, Minus, Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
// ✅ 1. 引入 Context Hook
import { useCartDrawer } from "@/context/CartContext";
import { useLocale } from "next-intl";
import { getTrans } from "@/lib/i18n-utils";

interface ProductDetailClientProps {
  product: any;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  const locale = useLocale();
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [loginTip, setLoginTip] = useState(""); // 提示信息状态
  
  // ✅ 2. 获取 Context 方法
  const { addToCart } = useCartDrawer();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // --- 图片处理 ---
  const allImages = [
    ...(product.coverImageUrl ? [product.coverImageUrl] : []),
    ...(product.images || [])
  ];
  const [selectedImage, setSelectedImage] = useState(allImages[0] || "");
  
  // --- 选购状态 ---
  // ✅ 扁平化：直接使用 Product 上的字段
  const [quantity, setQuantity] = useState(1);

  const currentStock = product.stockQuantity || 0;
  const isOutOfStock = currentStock <= 0;

  // ✅ 3. 核心逻辑：加入购物车
  const handleAddToCart = async (isBuyNow = false) => {
    // 如果是立即购买，先检查登录状态
    if (isBuyNow) {
      setIsCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      setIsCheckingAuth(false);

      if (!session) {
        // 未登录 -> 显示提示并跳转
        setLoginTip("请先登录账户，正在跳转...");
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }
    }

    // 构造商品数据
    const cartItem = {
      id: product.id,                 // ✅ 使用 Product ID
      productId: product.id,          // 商品 ID
      title: getTrans(product.title, locale),
      titleJson: product.title,       // ✅ 存入原始 Json
      price: product.basePrice,       // ✅ 使用基础价格
      image: selectedImage,
      flavor: getTrans(product.flavor, locale) || "默认口味", // ✅ 使用 Product 字段
      flavorJson: product.flavor,     // ✅ 存入原始 Json
      strength: product.nicotineStrength || "默认浓度", // ✅ 使用 Product 字段
      quantity: quantity,
      stock: currentStock             // 🔥 关键：必须传入库存，Context 会帮我们做校验
    };

    // 调用 Context 方法 (会自动做库存检查 + 更新状态)
    // 如果是"立即购买"，则不显示购物车侧边栏，直接跳转结算
    addToCart(cartItem, !isBuyNow);
    
    if (isBuyNow) {
      router.push("/checkout");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      
      {/* === 左侧：图片区域 === */}
      <div className="space-y-4">
        <div className="aspect-[4/5] w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 relative group">
           <img src={selectedImage} alt={getTrans(product.title, locale)} className="w-full h-full object-cover" />
        </div>
        {allImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {allImages.map((img, idx) => (
              <button key={idx} onClick={() => setSelectedImage(img)} className={`w-16 h-16 rounded-lg overflow-hidden border flex-shrink-0 ${selectedImage === img ? "border-red-500" : "border-white/10"}`}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* === 右侧：信息与操作 === */}
      <div className="flex flex-col h-full">
        <span className="text-red-500 font-bold tracking-wider text-sm uppercase mb-2">{getTrans(product.brand?.name, locale)}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{getTrans(product.title, locale)}</h1>
        
        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
          <span className="text-3xl font-mono text-white">${Number(product.basePrice).toFixed(2)}</span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-600" : "bg-green-500"}`} />
            <span className={isOutOfStock ? "text-red-500" : "text-green-500"}>
               {isOutOfStock ? "暂时缺货" : `库存: ${currentStock} 件`}
            </span>
          </div>
        </div>

        {/* 规格展示 (只读) */}
        <div className="space-y-6 mb-8">
          {getTrans(product.flavor, locale) && (
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase mb-3 block">口味 (Flavor)</label>
              <div className="px-4 py-2 text-sm rounded-lg border bg-white text-black border-white font-bold inline-block">
                {getTrans(product.flavor, locale)}
              </div>
            </div>
          )}

          {product.nicotineStrength && (
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase mb-3 block">尼古丁浓度 (Strength)</label>
              <div className="px-4 py-2 text-sm rounded-lg border bg-white text-black border-white font-bold inline-block">
                {product.nicotineStrength}
              </div>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="mt-auto space-y-6">
          <div className="flex items-center gap-4">
             <span className="text-sm text-zinc-500 font-bold">购买数量</span>
             <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))} 
                  className="p-3 text-zinc-400 hover:text-white disabled:opacity-30"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-12 text-center text-white font-mono text-sm">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(currentStock, q + 1))} 
                  className="p-3 text-zinc-400 hover:text-white disabled:opacity-30"
                  disabled={quantity >= currentStock}
                >
                  <Plus className="w-4 h-4" />
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative">
            <button 
              onClick={() => handleAddToCart(false)} // 加入购物车
              disabled={isOutOfStock}
              className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" /> 加入购物车
            </button>
            <button 
              onClick={() => handleAddToCart(true)} // 立即购买
              disabled={isOutOfStock || isCheckingAuth}
              className="py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCheckingAuth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              立即购买
            </button>

            {/* 登录提示气泡 */}
            {loginTip && (
               <div className="absolute bottom-full mb-3 right-0 w-1/2 bg-red-600 text-white text-xs font-bold py-2 px-3 rounded-lg text-center animate-in fade-in slide-in-from-bottom-2 shadow-xl z-20">
                 {loginTip}
                 <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-red-600 rotate-45"></div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}