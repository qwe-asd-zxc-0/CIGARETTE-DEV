'use client';

import { useState } from 'react';

export default function ExcelUploader() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgress] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setMessage('正在上传并解析...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/import-excel', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        // 尝试解析错误 JSON
        try {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Upload failed');
        } catch (e) {
            throw new Error(`Upload failed: ${res.statusText}`);
        }
      }

      if (!res.body) throw new Error('No response body');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // 保留最后一个可能不完整的片段
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            
            if (data.type === 'start') {
              setMessage(`开始处理 ${data.total} 条数据...`);
            } else if (data.type === 'progress') {
              const percent = Math.round((data.current / data.total) * 100);
              setProgress(percent);
              setMessage(`正在处理: ${data.current} / ${data.total} (成功: ${data.success})`);
            } else if (data.type === 'complete') {
              setProgress(100);
              setMessage(`✅ 处理完成! 总计: ${data.total}, 成功: ${data.success}`);
            }
          } catch (e) {
            console.error('Error parsing stream chunk', e);
          }
        }
      }

    } catch (err: any) {
      setMessage(`❌ 失败: ${err.message}`);
    } finally {
      setUploading(false);
      // 重置 input，允许重复上传同一文件
      e.target.value = '';
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

      {/* 3. 进度条 */}
      {uploading && (
        <div className="w-full bg-zinc-800 rounded-full h-2.5 overflow-hidden">
          <div 
            className="bg-green-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}

      {/* 4. 状态提示信息 */}
      {message && (
        <div className={`p-3 rounded text-sm border ${
          message.startsWith('✅') 
            ? 'bg-green-900/30 text-green-400 border-green-800' 
            : message.startsWith('❌')
              ? 'bg-red-900/30 text-red-400 border-red-800'
              : 'bg-blue-900/30 text-blue-400 border-blue-800'
        }`}>
          {message}
        </div>
      )}
    </div>
  );
}