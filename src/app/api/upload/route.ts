// src/app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { uploadFileToStorage } from '@/lib/supabase-admin';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    // --- 🛡️ 安全检查 Start ---
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 1. 验证登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 验证管理员权限
    // 假设此接口仅供后台上传商品图片使用。如果用户也需要上传头像，请调整此处的逻辑。
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    });

    if (!profile || !profile.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    // --- 🛡️ 安全检查 End ---

    // 3. 解析前端传来的 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 4. 将文件转换为 Buffer (Supabase Admin 需要 Buffer 格式)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 5. 生成一个唯一的文件名
    const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '');
    const uniquePath = `uploads/${Date.now()}-${safeName}`;

    // 6. 调用核心上传函数
    const publicUrl = await uploadFileToStorage(uniquePath, buffer);

    // 7. 返回成功结果给前端
    return NextResponse.json({ url: publicUrl });

  } catch (error: unknown) {
    console.error('Upload API Error:', error);
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}