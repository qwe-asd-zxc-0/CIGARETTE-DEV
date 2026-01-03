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

    // 🛡️ 防御 DoS: 检查 Content-Length
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > 10 * 1024 * 1024) { // 限制 10MB
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    // 3. 解析前端传来的 FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 🛡️ 二次检查: 检查实际文件大小
    if (file.size > 5 * 1024 * 1024) { // 限制 5MB
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // 4. 将文件转换为 Buffer 并验证文件头 (Magic Number)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 🛡️ 安全检查: 验证文件头并获取准确的 MIME 类型
    // 防止 "Polyglot" 攻击 (即伪装成图片的 HTML/JS)
    // 只有当文件头真正匹配图片格式时，我们才允许上传，并且强制使用该 MIME 类型
    const getMimeType = (buf: Buffer) => {
      const header = buf.toString('hex', 0, 4);
      // JPG: ffd8...
      if (header.startsWith('ffd8')) return 'image/jpeg';
      // PNG: 89504e47
      if (header === '89504e47') return 'image/png';
      // GIF: 47494638
      if (header === '47494638') return 'image/gif';
      // WebP: RIFF....WEBP
      if (buf.toString('hex', 0, 4) === '52494646' && buf.toString('hex', 8, 12) === '57454250') return 'image/webp';
      
      return null;
    };

    const detectedMimeType = getMimeType(buffer);

    if (!detectedMimeType) {
      return NextResponse.json({ error: 'Invalid file type. Only images are allowed.' }, { status: 400 });
    }

    // 5. 上传到 Supabase Storage

    // 5. 生成一个唯一的文件名 (保留原始扩展名，但确保安全)
    // 注意：虽然我们检测了 MIME，但为了兼容性，最好还是给文件一个正确的后缀
    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp'
    };
    const ext = extMap[detectedMimeType] || '.jpg';
    const safeName = `image-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
    const uniquePath = `uploads/${safeName}`;

    // 6. 调用核心上传函数 (🔥 关键：强制使用检测到的 MIME 类型)
    // 这样即使文件内容里包含 HTML，浏览器也会因为 Content-Type 是 image/xxx 而拒绝执行脚本
    const publicUrl = await uploadFileToStorage(uniquePath, buffer, detectedMimeType);

    // 7. 返回成功结果给前端
    return NextResponse.json({ url: publicUrl });

  } catch (error: unknown) {
    console.error('Upload API Error:', error);
    // 🛡️ 安全修复: 生产环境隐藏详细错误信息
    const message = process.env.NODE_ENV === 'production'
      ? 'Upload failed'
      : (error instanceof Error ? error.message : 'Upload failed');

    return NextResponse.json({ error: message }, { status: 500 });
  }
}