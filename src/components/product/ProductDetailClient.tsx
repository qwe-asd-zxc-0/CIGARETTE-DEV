"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Zap, Package, Minus, Plus, Check } from "lucide-react";
import { addToCart, CartItem } from "@/lib/cart"; //
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // 假设您使用了 sonner 或类似的 toast 库，如果没有可换成 alert

interface ProductDetailClientProps {
  product: any;
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  const router = useRouter();
  
  // 1. 图片处理
  const allImages = [
    ...(product.coverImageUrl ? [product.coverImageUrl] : []),
    ...(product.images || [])
  ];
  const [selectedImage, setSelectedImage] = useState(allImages[0] || "");
  
  // 2. 变体选择状态
  // 假设 product.variants 包含 { id, flavor, strength, stockQuantity }
  // 我们需要提取唯一的 flavor 和 strength 选项
  const variants = product.variants || [];
  const uniqueFlavors = Array.from(new Set(variants.map((v: any) => v.flavor))).filter(Boolean) as string[];
  const uniqueStrengths = Array.from(new Set(variants.map((v: any) => v.strength))).filter(Boolean) as string[];

  const [selectedFlavor, setSelectedFlavor] = useState<string>(uniqueFlavors[0] || "");
  const [selectedStrength, setSelectedStrength] = useState<string>(uniqueStrengths[0] || "");
  const [quantity, setQuantity] = useState(1);

  // 3. 查找当前选中的变体
  const currentVariant = variants.find((v: any) => 
    (!selectedFlavor || v.flavor === selectedFlavor) && 
    (!selectedStrength || v.strength === selectedStrength)
  );

  const currentStock = currentVariant?.stockQuantity || 0;
  const isOutOfStock = currentStock <= 0;

  // 加入购物车逻辑
  const handleAddToCart = (isBuyNow = false) => {
    if (!currentVariant) {
      alert("请选择完整的规格"); // 或 toast.error
      return;
    }

    const item: CartItem = {
      productId: product.id,
      variantId: currentVariant.id,
      title: product.title,
      flavor: selectedFlavor || "Default",
      strength: selectedStrength || "Default",
      price: product.basePrice, // 如果变体有价格，优先用 currentVariant.price
      image: selectedImage,
      quantity: quantity
    };

    addToCart(item);
    
    if (isBuyNow) {
      router.push("/checkout");
    } else {
      // 触发 Header 更新，并给用户反馈
      // toast.success("已加入购物车"); 
      alert("Success: Added to cart");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      {/* ...左侧图片区域保持不变... */}
      <div className="space-y-4">
        <div className="aspect-[4/5] w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 relative group">
           <img src={selectedImage} alt={product.title} className="w-full h-full object-cover" />
        </div>
        {allImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {allImages.map((img, idx) => (
              <button key={idx} onClick={() => setSelectedImage(img)} className={`w-16 h-16 rounded-lg overflow-hidden border ${selectedImage === img ? "border-red-500" : "border-white/10"}`}>
                <img src={img} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col h-full">
        <span className="text-red-500 font-bold tracking-wider text-sm uppercase mb-2">{product.brand?.name}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">{product.title}</h1>
        
        <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-6">
          <span className="text-3xl font-mono text-white">${Number(product.basePrice).toFixed(2)}</span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-600" : "bg-green-500"}`} />
            <span className={isOutOfStock ? "text-red-500" : "text-green-500"}>
               {isOutOfStock ? "Out of Stock" : `Stock: ${currentStock}`}
            </span>
          </div>
        </div>

        {/* 规格选择器 */}
        <div className="space-y-6 mb-8">
          {uniqueFlavors.length > 0 && (
            <div>
              <label className="text-xs text-zinc-500 font-bold uppercase mb-3 block">Flavor</label>
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
              <label className="text-xs text-zinc-500 font-bold uppercase mb-3 block">Strength</label>
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
             <span className="text-sm text-zinc-500 font-bold">Quantity</span>
             <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-3 text-zinc-400 hover:text-white"><Minus className="w-4 h-4" /></button>
                <span className="w-8 text-center text-white font-mono text-sm">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(currentStock, q + 1))} className="p-3 text-zinc-400 hover:text-white"><Plus className="w-4 h-4" /></button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleAddToCart(false)}
              disabled={isOutOfStock}
              className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </button>
            <button 
              onClick={() => handleAddToCart(true)}
              disabled={isOutOfStock}
              className="py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 fill-current" /> Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}