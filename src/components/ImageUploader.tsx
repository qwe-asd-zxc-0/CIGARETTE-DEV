'use client'; // 这是一个客户端交互组件

import { useState } from 'react';

// 定义组件接收的参数：上传成功后回调函数
interface ImageUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function ImageUploader({ onUploadComplete }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 本地预览 (让用户立即看到选了什么图)
    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      // 1. 构建 FormData
      const formData = new FormData();
      formData.append('file', file);

      // 2. 请求咱们刚才写的 API
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // 3. 上传成功！把 URL 传给父组件
      console.log('Upload success:', data.url);
      onUploadComplete(data.url);

    } catch (error) {
      console.error(error);
      alert('图片上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 border-2 border-dashed border-gray-300 p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      
      {/* 预览区域 */}
      {preview ? (
        <div className="relative w-40 h-40">
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover rounded-md shadow-sm" 
          />
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md text-white font-bold animate-pulse">
              上传中...
            </div>
          )}
        </div>
      ) : (
        <div className="text-gray-400 text-center">
          <p>暂无图片</p>
        </div>
      )}

      {/* 隐藏原本丑陋的 input，用 Label 包装美化 */}
      <label className="cursor-pointer bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50">
        {uploading ? '正在处理...' : '选择图片上传'}
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange} 
          className="hidden" 
          disabled={uploading}
        />
      </label>
      
      <p className="text-xs text-gray-400">支持 JPG, PNG, WEBP (最大 5MB)</p>
    </div>
  );
}