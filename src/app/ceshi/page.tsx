'use client';

import { useState } from 'react';
// 确保您已经创建了这两个组件文件
import ImageUploader from '@/components/ImageUploader';
import ExcelUploader from '@/components/ExcelUploader';

export default function AdminDashboard() {
  const [productImageUrl, setProductImageUrl] = useState('');

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
          后台管理工具箱 (Admin Tools)
        </h1>
        <p className="text-zinc-400 mb-12">
          用于测试图片上传和批量导入商品数据的开发者面板。
        </p>

        {/* 模块 1: Excel 批量导入 */}
        <section className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-red-600 text-xs font-bold px-2 py-1 rounded">工具 A</span>
            <h2 className="text-2xl font-bold">Excel 批量导入商品</h2>
          </div>
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <p className="text-sm text-zinc-500 mb-4">
              请上传包含 Brand, Title, SKU 等信息的 .xlsx 文件。
            </p>
            {/* 这里的 ExcelUploader 组件内部包含了“上传”和“下载模板”两个按钮 */}
            <ExcelUploader />
          </div>
        </section>

        {/* 分隔线 */}
        <hr className="border-zinc-800 my-12" />

        {/* 模块 2: 图片上传测试 */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded">工具 B</span>
            <h2 className="text-2xl font-bold">单张图片上传 & URL 生成</h2>
          </div>
          
          <div className="bg-zinc-900/50 p-6 rounded-2xl border border-zinc-800">
            <p className="text-sm text-zinc-500 mb-4">
              上传图片到 Supabase Storage 并获取永久公开链接 (Public URL)。
            </p>

            <div className="max-w-md">
              <ImageUploader 
                onUploadComplete={(url) => {
                  setProductImageUrl(url);
                }} 
              />
            </div>

            {/* 显示生成的 URL 和预览 */}
            {productImageUrl && (
              <div className="mt-6 p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-green-400 text-sm font-bold mb-2">✅ 图片上传成功! 公开链接如下:</p>
                <div className="flex gap-2 items-center">
                  <code className="block bg-black/50 p-3 rounded text-xs text-zinc-300 break-all font-mono flex-1">
                    {productImageUrl}
                  </code>
                  <button 
                    onClick={() => navigator.clipboard.writeText(productImageUrl)}
                    className="text-xs bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-white transition"
                  >
                    复制
                  </button>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-zinc-500 mb-2">预览:</p>
                  <img src={productImageUrl} alt="Uploaded" className="h-32 rounded border border-zinc-700 object-cover" />
                </div>
              </div>
            )}
          </div>
        </section>

      </div>
    </div>
  );
}