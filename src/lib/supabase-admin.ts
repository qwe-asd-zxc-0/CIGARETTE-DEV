import { createClient } from '@supabase/supabase-js';

// 1. 获取环境变量，并进行安全检查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// 注意：我们在 .env 文件里设置的是 SUPABASE_SERVICE_ROLE_KEY，要保持一致
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  // 在构建时或无相关功能调用时不抛错，防止 CI/CD 崩溃，但在调用时会失败
  console.warn("⚠️ Supabase Admin Warning: Missing 'NEXT_PUBLIC_SUPABASE_URL' or 'SUPABASE_SERVICE_ROLE_KEY'. Admin features may fail.");
}

// 2. 创建拥有超级权限的 Admin 客户端
// ⚠️ 警告：此客户端拥有数据库和 Auth 的完全访问权限，仅限服务端使用！
export const supabaseAdmin = createClient(
  supabaseUrl || "", 
  supabaseServiceKey || "", 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false, // 服务端无需持久化 Session
    },
  }
);

/**
 * 核心：Storage 上传函数
 * @param bucketName 存储桶名称 (默认为 'product-images')
 * @param filePath 存储路径
 * @param fileBuffer 文件数据
 * @param contentType 文件类型
 */
export async function uploadFileToStorage(
  filePath: string, 
  fileBuffer: Buffer,
  contentType: string = 'image/jpeg',
  bucketName: string = 'product-images'
) {
  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      cacheControl: '3600',
      upsert: true,
      contentType: contentType,
    });

  if (error) {
    console.error("Storage upload error:", error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}