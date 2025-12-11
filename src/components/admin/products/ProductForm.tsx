"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // ✅ 1. 引入路由钩子
import ImageUploader from "@/components/ImageUploader";
import ExcelUploader from "@/components/ExcelUploader";
import { upsertProduct } from "@/app/admin/(protected)/products/actions";
import { Loader2, Save, ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react";
import Link from "next/link";

interface ProductFormProps {
  product?: any;
  isCreate: boolean;
  brands: { id: number; name: string }[];
}

export default function ProductForm({ product, isCreate, brands }: ProductFormProps) {
  // ✅ 2. 初始化 Router
  const router = useRouter();

  // === 1. 基础状态 ===
  const [coverImageUrl, setCoverImageUrl] = useState(product?.coverImageUrl || "");
  const [galleryImages, setGalleryImages] = useState<string[]>(product?.images || []);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // === 2. 高级配置状态 (UI 驱动) ===
  
  // (A) 规格参数: 把 Object { "Color": "Red" } 转为 Array [{ key: "Color", val: "Red" }]
  const [specs, setSpecs] = useState<{ key: string; val: string }[]>(() => {
    if (!product?.specifications) return [];
    return Object.entries(product.specifications).map(([key, val]) => ({
      key,
      val: String(val)
    }));
  });

  // (B) 阶梯定价: 数据库存的是 Array [{ min: 10, price: 5 }]，直接使用即可
  const [tiers, setTiers] = useState<{ min: number | string; price: number | string }[]>(
    product?.tieredPricingRules || []
  );

  // === 3. 事件处理 ===

  const handleCoverUpload = (url: string) => setCoverImageUrl(url);
  const handleGalleryUpload = (url: string) => {
    setGalleryImages(prev => [...prev, url]);
    alert("✅ 图片已添加到图集");
  };

  // --- 规格操作 ---
  const addSpec = () => setSpecs([...specs, { key: "", val: "" }]);
  const removeSpec = (index: number) => setSpecs(specs.filter((_, i) => i !== index));
  const updateSpec = (index: number, field: 'key' | 'val', value: string) => {
    const newSpecs = [...specs];
    newSpecs[index][field] = value;
    setSpecs(newSpecs);
  };

  // --- 阶梯价操作 ---
  const addTier = () => setTiers([...tiers, { min: "", price: "" }]);
  const removeTier = (index: number) => setTiers(tiers.filter((_, i) => i !== index));
  const updateTier = (index: number, field: 'min' | 'price', value: string) => {
    const newTiers = [...tiers];
    newTiers[index] = { ...newTiers[index], [field]: value };
    setTiers(newTiers);
  };

  // === 4. 提交处理 ===
  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    
    // --- 图片数据注入 ---
    formData.set("coverImageUrl", coverImageUrl);
    formData.set("images", JSON.stringify(galleryImages));

    // --- 关键：数据转换 (UI Array -> Database JSON) ---

    // 1. 规格参数：数组转对象
    const specsObject = specs.reduce((acc, item) => {
      if (item.key.trim()) {
        acc[item.key.trim()] = item.val.trim();
      }
      return acc;
    }, {} as Record<string, string>);
    formData.set("specifications", JSON.stringify(specsObject));

    // 2. 阶梯定价：格式化数字
    const tiersArray = tiers
      .map(t => ({ min: Number(t.min), price: Number(t.price) }))
      .filter(t => t.min > 0 && t.price >= 0); // 过滤无效数据
    formData.set("tieredPricingRules", JSON.stringify(tiersArray));

    try {
      const res = await upsertProduct(formData, !isCreate ? product?.id : undefined);
      
      if (res && !res.success) {
        // 失败逻辑
        alert(`❌ 操作失败: ${res.message}`); 
        setIsSubmitting(false);
      } else {
        // ✅ 3. 成功逻辑：手动跳转
        console.log("✅ 提交成功");
        alert("✅ 保存成功！即将返回列表...");
        
        // 强制刷新当前路由缓存，确保列表页数据最新
        router.refresh();
        // 跳转回商品列表
        router.push("/admin/products");
        
        // 这里不调用 setIsSubmitting(false)，保持加载状态直到页面跳转，防止重复点击
      }
    } catch (error) {
      console.error(error);
      alert("❌ 网络错误或服务器异常");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-20">
      {/* 顶部导航 */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 bg-zinc-900 rounded-full border border-white/10 hover:bg-zinc-800">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">{isCreate ? "创建新商品" : "编辑商品"}</h1>
          <p className="text-zinc-400 text-sm">配置商品信息、价格及规格。</p>
        </div>
      </div>

      <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === 左侧主内容 === */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* 1. 基本信息 */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-4">基本信息</h2>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">品牌 (Brand) *</label>
              <select name="brandId" required defaultValue={product?.brandId || ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none">
                <option value="" disabled>-- 请选择品牌 --</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="col-span-2">
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">商品名称 *</label>
                 <input name="title" required defaultValue={product?.title || ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">基础价格 ($) *</label>
                 <input name="price" type="number" step="0.01" required defaultValue={product?.price || ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">产地</label>
                 <input name="origin" defaultValue={product?.origin || ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none" />
               </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">商品描述</label>
              <textarea name="description" rows={4} defaultValue={product?.description || ""} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-600 outline-none" />
            </div>
          </div>

          {/* === 2. 高级配置 (UI 重构版) === */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-8">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-4">高级配置</h2>

            {/* (A) 规格参数动态表单 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-zinc-300">规格参数 (Specifications)</label>
                <button type="button" onClick={addSpec} className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 transition">
                  <Plus className="w-3 h-3" /> 添加规格
                </button>
              </div>
              
              {specs.length === 0 && (
                <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-zinc-600 text-xs">
                  暂无规格，点击上方按钮添加。
                </div>
              )}

              <div className="space-y-2">
                {specs.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="w-8 flex justify-center text-zinc-600"><GripVertical className="w-4 h-4" /></div>
                    <input 
                      type="text" 
                      placeholder="项目 (如: Puffs)" 
                      value={item.key}
                      onChange={(e) => updateSpec(index, 'key', e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                    <input 
                      type="text" 
                      placeholder="内容 (如: 5000)" 
                      value={item.val}
                      onChange={(e) => updateSpec(index, 'val', e.target.value)}
                      className="flex-1 bg-black/40 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                    />
                    <button type="button" onClick={() => removeSpec(index)} className="p-2 text-zinc-500 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-zinc-500 pl-8">系统会自动将其保存为 JSON 格式。</p>
            </div>

            <div className="h-px bg-white/5" />

            {/* (B) 阶梯定价动态表单 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-bold text-zinc-300">阶梯批发价 (Wholesale Pricing)</label>
                <button type="button" onClick={addTier} className="text-xs flex items-center gap-1 text-green-400 hover:text-green-300 transition">
                  <Plus className="w-3 h-3" /> 添加阶梯
                </button>
              </div>

              {tiers.length === 0 && (
                <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-zinc-600 text-xs">
                  暂无批发价规则，点击上方按钮添加。
                </div>
              )}

              <div className="space-y-2">
                {tiers.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="w-8 flex justify-center text-zinc-600 text-xs font-mono">{index + 1}.</div>
                    <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/10 rounded px-3 py-2">
                      <span className="text-zinc-500 text-xs">满</span>
                      <input 
                        type="number" 
                        placeholder="数量" 
                        value={item.min}
                        onChange={(e) => updateTier(index, 'min', e.target.value)}
                        className="w-full bg-transparent text-sm text-white outline-none"
                      />
                      <span className="text-zinc-500 text-xs">件</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-black/40 border border-white/10 rounded px-3 py-2">
                      <span className="text-zinc-500 text-xs">单价 $</span>
                      <input 
                        type="number" 
                        placeholder="价格" 
                        value={item.price}
                        onChange={(e) => updateTier(index, 'price', e.target.value)}
                        className="w-full bg-transparent text-sm text-white outline-none"
                      />
                    </div>
                    <button type="button" onClick={() => removeTier(index)} className="p-2 text-zinc-500 hover:text-red-500 transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isCreate && (
             <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
               <h2 className="text-lg font-bold text-white mb-4">Excel 批量导入</h2>
               <ExcelUploader />
             </div>
          )}
        </div>

        {/* === 右侧侧边栏 === */}
        <div className="space-y-8">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">封面图片</h2>
            <ImageUploader onUploadComplete={handleCoverUpload} />
            {coverImageUrl ? (
              <div className="mt-4 aspect-square rounded overflow-hidden border border-white/20 bg-black">
                <img src={coverImageUrl} className="w-full h-full object-cover" />
              </div>
            ) : <div className="mt-4 p-4 text-xs text-zinc-500 text-center border border-dashed border-white/10 rounded">暂无封面</div>}
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">图集 (Gallery)</h2>
            <ImageUploader onUploadComplete={handleGalleryUpload} />
            <div className="mt-4 grid grid-cols-3 gap-2">
              {galleryImages.map((img, i) => (
                <div key={i} className="relative group">
                  <img src={img} className="w-full h-20 object-cover rounded border border-white/10" />
                  <button type="button" onClick={() => setGalleryImages(galleryImages.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-4">
             <h2 className="text-lg font-bold text-white">发布操作</h2>
             <select name="status" defaultValue={product?.status || "active"} className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm">
                <option value="active">🟢 上架 (Active)</option>
                <option value="draft">🟡 草稿 (Draft)</option>
                <option value="archived">🔴 归档 (Archived)</option>
             </select>
             <button type="submit" disabled={isSubmitting} className="w-full bg-red-600 hover:bg-red-500 py-3 rounded-lg font-bold text-white transition-all flex justify-center items-center gap-2">
               {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin"/> 保存中...</> : <><Save className="w-4 h-4"/> 保存商品</>}
             </button>
          </div>
        </div>
      </form>
    </div>
  );
}