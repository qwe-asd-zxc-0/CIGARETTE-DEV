"use client";

import { useState } from "react";
import ImageUploader from "@/components/ImageUploader";
import ExcelUploader from "@/components/ExcelUploader";
import { upsertProduct } from "@/app/admin/(protected)/products/actions";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ProductFormProps {
  product?: any;
  isCreate: boolean;
}

export default function ProductForm({ product, isCreate }: ProductFormProps) {
  // 图片状态：如果有新上传的用新上传的，否则用原来的，都没有就是空字符串
  const [imageUrl, setImageUrl] = useState(product?.images?.[0] || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 图片上传回调
  const handleImageUpload = (url: string) => {
    console.log("Image uploaded:", url);
    setImageUrl(url);
    alert("✅ 图片上传成功！请记得点击下方的'保存'按钮提交数据。");
  };

  // 提交表单处理
  const handleSubmit = async (formData: FormData) => {
    // 1. 设置加载状态 (防止重复点击)
    setIsSubmitting(true);
    
    // 2. 注入图片数据到 FormData
    // 如果 imageUrl 有值，就封装成 JSON 数组；否则使用旧数据或空数组
    const images = imageUrl ? [imageUrl] : (product?.images || []);
    formData.set("images", JSON.stringify(images));

    try {
      // 3. 调用后端 Server Action
      // 如果是编辑模式，传递 product.id；如果是新建模式，传 undefined
      const res = await upsertProduct(formData, !isCreate ? product?.id : undefined);

      // 4. 处理返回结果
      // 注意：如果 upsertProduct 执行了 redirect，这里通常不会被执行（因为页面开始卸载跳转）
      // 但如果后端明确返回了 { success: false }，我们需要处理错误
      if (res && !res.success) {
        alert(`❌ 操作失败: ${res.message}`); 
        setIsSubmitting(false); // 停止 Loading，让用户可以修改后重试
      } else {
        // ✅ 成功的情况：
        // 不需要 alert("成功")，因为马上要跳转了。
        // 也不要 setIsSubmitting(false)，保持 Loading 状态直到跳转完成，体验更好。
        console.log("提交成功，正在跳转...");
      }
    } catch (error) {
      // 捕获网络层面的未知错误
      console.error("Submit error:", error);
      alert("❌ 网络错误或服务器无响应，请重试。");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 font-sans pb-20">
      
      {/* === 顶部导航与标题 === */}
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition border border-white/10">
          <ArrowLeft className="w-5 h-5 text-zinc-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            {isCreate ? "创建新商品" : "编辑商品"}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            {isCreate ? "填写信息以添加库存。" : `正在编辑 ID: ${product?.id}`}
          </p>
        </div>
      </div>

      {/* === 表单区域 (使用 form 包裹) === */}
      <form action={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* === 左侧：核心信息 (占 2/3) === */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-4">基本信息 (Basic Info)</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">商品名称 *</label>
                <input 
                  name="title" 
                  required
                  type="text" 
                  defaultValue={product?.title || ""}
                  placeholder="请输入商品名称，例如: Elf Bar BC5000"
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 outline-none transition-all placeholder:text-zinc-700"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">价格 ($) *</label>
                  <input 
                    name="price" 
                    required
                    type="number" 
                    step="0.01"
                    defaultValue={product?.price || ""}
                    placeholder="0.00"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 outline-none placeholder:text-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">产地 (Origin)</label>
                  <input 
                    name="origin" 
                    type="text" 
                    defaultValue={product?.origin || ""}
                    placeholder="例如: USA / China"
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 outline-none placeholder:text-zinc-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">商品描述</label>
                <textarea 
                  name="description"
                  rows={5}
                  defaultValue={product?.description || ""}
                  placeholder="请输入商品的详细描述、口味、规格等信息..."
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-red-500 outline-none resize-none placeholder:text-zinc-700"
                />
              </div>
            </div>
          </div>

          {/* Excel 导入工具 (仅新建时显示) */}
          {isCreate && (
            <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-blue-600 text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase">工具</span>
                <h2 className="text-lg font-bold text-white">Excel 批量导入</h2>
              </div>
              <p className="text-sm text-zinc-400 mb-6">
                如果没有时间逐个添加，您可以上传 .xlsx 表格文件批量导入商品。
              </p>
              <ExcelUploader />
            </div>
          )}
        </div>

        {/* === 右侧：侧边栏 (占 1/3) === */}
        <div className="space-y-8">
          
          {/* 图片上传区域 */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-4 mb-4">商品图片</h2>
            
            <ImageUploader onUploadComplete={handleImageUpload} />
            
            {/* 图片预览 */}
            {(imageUrl || (product?.images && product.images.length > 0)) ? (
              <div className="mt-4 relative aspect-square rounded-lg overflow-hidden border-2 border-green-500/50 bg-black/50">
                <img 
                  src={imageUrl || product.images[0]} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute bottom-0 left-0 right-0 bg-green-600/90 text-white text-xs font-bold py-1 text-center backdrop-blur-sm">
                  {imageUrl ? "新上传 (Ready)" : "当前图片"}
                </div>
              </div>
            ) : (
              <div className="mt-4 p-8 border border-dashed border-white/10 rounded-lg text-center">
                <p className="text-zinc-500 text-xs">暂无图片预览</p>
              </div>
            )}
          </div>

          {/* 发布设置区域 */}
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-white/5 pb-4">发布状态</h2>
            
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-2">选择状态</label>
              <select 
                name="status"
                defaultValue={product?.status || "draft"}
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-blue-500 outline-none appearance-none"
              >
                <option value="active">🟢 上架销售 (Active)</option>
                <option value="draft">🟡 存为草稿 (Draft)</option>
                <option value="archived">🔴 下架归档 (Archived)</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-4 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                isSubmitting 
                  ? "bg-zinc-700 text-zinc-400 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-500 text-white shadow-red-900/20"
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> 处理中...</>
              ) : (
                <><Save className="w-5 h-5" /> {isCreate ? "确认创建" : "保存更改"}</>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
  
}
