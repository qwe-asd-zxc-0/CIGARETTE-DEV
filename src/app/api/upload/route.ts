// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { uploadFileToStorage } from '@/lib/supabase-admin'; // 引入您之前写的管理员工具

export async function POST(request: Request) {
  try {
    // 1. 解析前端传来的 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 2. 将文件转换为 Buffer (Supabase Admin 需要 Buffer 格式)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 3. 生成一个唯一的文件名 (防止文件名冲突)
    // 格式: uploads/时间戳-原文件名
    // 注意：去除文件名中的特殊字符，只保留字母数字和点
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const uniquePath = `uploads/${Date.now()}-${safeName}`;

    // 4. 调用核心上传函数 (这一步就是调用您在 supabase-admin.ts 里写的函数)
    const publicUrl = await uploadFileToStorage(uniquePath, buffer);

    // 5. 返回成功结果给前端
    return NextResponse.json({ url: publicUrl });

  } catch (error: unknown) {
    console.error('Upload API Error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}