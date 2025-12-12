"use client";

import { useState } from "react";
import { ShoppingCart, Zap, Package, Minus, Plus } from "lucide-react";

interface ProductDetailClientProps {
  product: any; // 包含 brand, variants 等信息
}

export default function ProductDetailClient({ product }: ProductDetailClientProps) {
  // 1. 合并所有图片用于图集展示
  const allImages = [
    ...(product.coverImageUrl ? [product.coverImageUrl] : []),
    ...(product.images || [])
  ];

  // 2. 状态管理
  const [selectedImage, setSelectedImage] = useState(allImages[0] || "");
  const [quantity, setQuantity] = useState(1);

  // 3. 计算总库存 (从变体表中累加)
  const totalStock = product.variants?.reduce((acc: number, curr: any) => acc + (curr.stockQuantity || 0), 0) || 0;
  const isOutOfStock = totalStock <= 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
      
      {/* === 左侧：图片区域 (保留原有 aspect-[4/5] 和样式) === */}
      <div className="space-y-4">
        {/* 主图 */}
        <div className="aspect-[4/5] w-full bg-zinc-900 rounded-2xl overflow-hidden border border-white/5 relative group">
          {selectedImage ? (
            <img 
              src={selectedImage} 
              alt={product.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-700">
              <Package className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-xs uppercase">暂无预览</span>
            </div>
          )}
        </div>

        {/* 新增：缩略图集 (保留原风格的圆角和边框) */}
        {allImages.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {allImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedImage(img)}
                className={`relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border transition-all ${
                  selectedImage === img 
                    ? "border-red-500 opacity-100" 
                    : "border-white/10 opacity-60 hover:opacity-100 hover:border-white/30"
                }`}
              >
                <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* === 右侧：信息区域 (复用原有 flex-col h-full 结构) === */}
      <div className="flex flex-col h-full">
        <div className="mb-2">
          <span className="text-red-500 font-bold tracking-wider text-sm uppercase">
            {product.brand?.name}
          </span>
        </div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
          {product.title}
        </h1>

        {/* 价格与库存信息 */}
        <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-8">
          <span className="text-3xl font-mono text-white">
            ${Number(product.basePrice).toFixed(2)}
          </span>
          <span className="px-3 py-1 bg-zinc-800 rounded text-xs text-zinc-400 border border-white/5">
            含税
          </span>
          
          {/* 新增：库存状态显示 */}
          <div className="ml-auto flex items-center gap-2 text-xs">
            <div className={`w-2 h-2 rounded-full ${isOutOfStock ? "bg-red-600" : "bg-green-500 animate-pulse"}`} />
            <span className={isOutOfStock ? "text-red-500" : "text-green-500"}>
               {isOutOfStock ? "缺货" : `库存: ${totalStock}`}
            </span>
          </div>
        </div>

        <div className="prose prose-invert prose-sm mb-10 text-zinc-400">
          <h3 className="text-white font-bold mb-2">商品详情</h3>
          <p className="whitespace-pre-line leading-relaxed">
            {product.description || "暂无详细描述"}
          </p>
        </div>

        {/* 底部操作区 (样式重构以包含数量和按钮) */}
        <div className="mt-auto space-y-6">
          
          {/* 数量选择器 */}
          <div className="flex items-center gap-4">
             <span className="text-sm text-zinc-500 font-bold">数量</span>
             <div className="flex items-center bg-zinc-900 border border-white/10 rounded-lg">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="p-3 text-zinc-400 hover:text-white disabled:opacity-30"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center text-white font-mono text-sm">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(totalStock, quantity + 1))}
                  disabled={quantity >= totalStock || isOutOfStock}
                  className="p-3 text-zinc-400 hover:text-white disabled:opacity-30"
                >
                  <Plus className="w-4 h-4" />
                </button>
             </div>
          </div>

          {/* 操作按钮组 */}
          <div className="grid grid-cols-2 gap-4">
            <button 
                disabled={isOutOfStock}
                className="py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl border border-white/10 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              加入购物车
            </button>
            <button 
                disabled={isOutOfStock}
                className="py-4 bg-white text-black hover:bg-zinc-200 font-bold rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4 fill-current" />
              立即购买
            </button>
          </div>

          {/* 底部提示 */}
          <p className="text-xs text-zinc-600 text-center">
             所有订单将在 24 小时内发货 · 全球配送
          </p>
        </div>
      </div>
    </div>
  );
}