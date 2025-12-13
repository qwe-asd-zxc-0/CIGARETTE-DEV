"use client";

import { useState } from "react";
import { ShoppingCart, Zap, Minus, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
// ✅ 1. 引入 Context Hook
import { useCartDrawer } from "@/context/CartContext";

interface ProductDetailClientProps {
  product: any;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  
  // ✅ 2. 获取 Context 方法
  const { addToCart } = useCartDrawer();

  // --- 图片处理 ---
  const allImages = [
    ...(product.coverImageUrl ? [product.coverImageUrl] : []),
    ...(product.images || [])
  ];
  const [selectedImage, setSelectedImage] = useState(allImages[0] || "");
  
  // --- 变体数据处理 ---
  const variants = product.variants || [];
  const uniqueFlavors = Array.from(new Set(variants.map((v: any) => v.flavor))).filter(Boolean) as string[];
  const uniqueStrengths = Array.from(new Set(variants.map((v: any) => v.strength))).filter(Boolean) as string[];

  // --- 选购状态 ---
  const [selectedFlavor, setSelectedFlavor] = useState<string>(uniqueFlavors[0] || "");
  const [selectedStrength, setSelectedStrength] = useState<string>(uniqueStrengths[0] || "");
  const [quantity, setQuantity] = useState(1);

  // --- 查找当前选中的 SKU ---
  const currentVariant = variants.find((v: any) => 
    (!selectedFlavor || v.flavor === selectedFlavor) && 
    (!selectedStrength || v.strength === selectedStrength)
  );

  const currentStock = currentVariant?.stockQuantity || 0;
  const isOutOfStock = currentStock <= 0;

  // ✅ 3. 核心逻辑：加入购物车
  const handleAddToCart = (isBuyNow = false) => {
    // 基础校验
    if (!currentVariant) {
      alert("请选择完整的规格（口味 & 浓度）");
      return;
    }

    // 构造商品数据
    const cartItem = {
      id: currentVariant.id,          // SKU ID
      productId: product.id,          // 商品 ID
      title: product.title,
      // 如果变体有特定价格就用变体的，否则用基础价
      price: currentVariant.price || product.basePrice, 
      image: selectedImage,
      flavor: selectedFlavor || "默认口味",
      strength: selectedStrength || "默认浓度",
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
           <img src={selectedImage} alt={product.title} className="w-full h-full object-cover" />
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
        <span className="text-red-500 font-bold tracking-wider text-sm uppercase mb-2">{product.brand?.name}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{product.title}</h1>
        
        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
          <span className="text-3xl font-mono text-white">${Number(product.basePrice).toFixed(2)}</span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-600" : "bg-green-500"}`} />
            <span className={isOutOfStock ? "text-red-500" : "text-green-500"}>
               {isOutOfStock ? "暂时缺货" : `库存: ${currentStock} 件`}
            </span>
          </div>
        </div>

        {/* 规格选择器 */}
        <div className="space-y-6 mb-8">
          {uniqueFlavors.length > 0 && (
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase mb-3 block">选择口味 (Flavor)</label>
              <div className="flex flex-wrap gap-2">
                {uniqueFlavors.map(flavor => (
                  <button
                    key={flavor}
                    onClick={() => setSelectedFlavor(flavor)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      selectedFlavor === flavor 
                      ? "bg-white text-black border-white font-bold" 
                      : "bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            </div>
          )}

          {uniqueStrengths.length > 0 && (
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase mb-3 block">尼古丁浓度 (Strength)</label>
              <div className="flex flex-wrap gap-2">
                {uniqueStrengths.map(strength => (
                  <button
                    key={strength}
                    onClick={() => setSelectedStrength(strength)}
                    className={`px-4 py-2 text-sm rounded-lg border transition-all ${
                      selectedStrength === strength 
                      ? "bg-white text-black border-white font-bold" 
                      : "bg-zinc-900 text-zinc-400 border-white/10 hover:border-white/30"
                    }`}
                  >
                    {strength}
                  </button>
                ))}
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

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleAddToCart(false)} // 加入购物车
              disabled={isOutOfStock}
              className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" /> 加入购物车
            </button>
            <button 
              onClick={() => handleAddToCart(true)} // 立即购买
              disabled={isOutOfStock}
              className="py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 fill-current" /> 立即购买
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}