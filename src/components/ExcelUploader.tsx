'use client';

import { useState } from 'react';

export default function ExcelUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage('正在解析并入库，请稍候...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(`✅ ${data.message}`);
      } else {
        setMessage(`❌ 失败: ${data.error}`);
      }
    } catch {
      setMessage('❌ 网络错误');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 顶部操作区：左边上传，右边下载模板 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        
        {/* 1. 上传按钮 */}
        <label className={`
          cursor-pointer px-4 py-2 rounded bg-green-600 text-white font-bold hover:bg-green-700 transition flex items-center justify-center gap-2
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}>
          {/* 上传图标 */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          
          {uploading ? '处理中...' : '选择上传的 Excel'}
          
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileUpload} 
            disabled={uploading}
            className="hidden" 
          />
        </label>
        
        {/* 2. 下载模板按钮 */}
        {/* 直接指向您的 API，浏览器会自动触发下载 */}
        <a 
          href="/api/admin/download-template"
          className="text-zinc-400 text-sm hover:text-green-400 hover:underline flex items-center gap-1 transition-colors"
        >
          {/* 下载图标 */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          下载标准模板 (.xlsx)
        </a>
      </div>

      {/* 3. 状态提示信息 */}
      {message && (
        <div className={`p-3 rounded text-sm border ${
          message.startsWith('✅') 
            ? 'bg-green-900/30 text-green-400 border-green-800' 
            : 'bg-red-900/30 text-red-400 border-red-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}