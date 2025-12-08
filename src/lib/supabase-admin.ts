// src/lib/supabase-admin.ts

import { createClient } from '@supabase/supabase-js';

// ⚠️ 警告：使用 service_role key，仅在服务端运行！
// 这个客户端有完整的读写权限，会忽略 RLS。
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY! // 使用 Service Key
);

/**
 * 核心：Storage 上传函数
 * @param filePath 存储桶内的路径 (例如: 'product-images/elfbar-bc5000.jpg')
 * @param fileBuffer 文件数据流
 */
export async function uploadFileToStorage(filePath: string, fileBuffer: Buffer) {
  const { data, error } = await supabaseAdmin.storage
    .from('product-images') // 替换为您创建的存储桶名称
    .upload(filePath, fileBuffer, {
      cacheControl: '3600',
      upsert: true, // 允许覆盖同名文件
      contentType: 'image/jpeg', // 需根据实际文件类型调整
    });

  if (error) {
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  // 获取公开 URL
  const publicUrl = supabaseAdmin.storage
    .from('product-images')
    .getPublicUrl(filePath).data.publicUrl;

  return publicUrl;
}