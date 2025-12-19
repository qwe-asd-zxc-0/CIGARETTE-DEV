import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // --- 🛡️ IP Rate Limit Check ---
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : "unknown";
    
    // 限制规则：每个 IP 每小时最多注册 3 个账号
    const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour
    const MAX_REGISTRATIONS = 3; 

    if (ip !== "unknown" && ip !== "::1" && ip !== "127.0.0.1") { // 本地开发可跳过，或者为了测试也加上
      const recentRegistrations = await prisma.rateLimit.count({
        where: {
          ip: ip,
          action: "register",
          createdAt: {
            gte: new Date(Date.now() - RATE_LIMIT_WINDOW)
          }
        }
      });

      if (recentRegistrations >= MAX_REGISTRATIONS) {
        return NextResponse.json(
          { error: "当前 IP 注册过于频繁，请稍后再试。" },
          { status: 429 }
        );
      }
    }
    // ------------------------------

    const body = await request.json();
    const { email, password, fullName } = body;

    console.log(`[Register Attempt] Email: ${email}, FullName: ${fullName}, IP: ${ip}`);

    // 0. 分别检查 Email 和 FullName，避免逻辑混淆
    const existingEmail = await prisma.profile.findUnique({
      where: { email: email }
    });

    if (existingEmail) {
      console.log(`[Register Fail] Email already exists: ${email}`);
      return NextResponse.json({ error: '该邮箱已被注册，请直接登录。' }, { status: 409 });
    }

    const existingName = await prisma.profile.findUnique({
      where: { fullName: fullName }
    });

    if (existingName) {
      console.log(`[Register Fail] FullName already exists: ${fullName}`);
      return NextResponse.json({ error: '该全名已被占用，请更换一个。' }, { status: 409 });
    }

    // 1. 初始化 Supabase Admin
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 

    let userId = "";
    
    // 2. 尝试在 Supabase Auth 创建用户
    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: { full_name: fullName }
      });

      if (authError) {
        console.error("Supabase Auth Error:", authError.message);
        // 通常 Supabase 返回 "User already registered"
        return NextResponse.json({ error: authError.message }, { status: 400 });
      }

      if (authData.user) {
        userId = authData.user.id;
      }
    } 
    else {
      console.warn("未检测到 Supabase Service Key，使用随机 UUID。");
      userId = crypto.randomUUID(); 
    }

    // 3. 将用户信息写入 Prisma 数据库
    console.log(`正在写入数据库 Profile: ${userId}, ${email}`);
    
    const profile = await prisma.profile.create({
      data: {
        id: userId,
        email,
        fullName: fullName, // 此时已确信 fullName 不重复
        createdAt: new Date(),
        isAgeVerified: true, // ✅ 默认所有注册用户年龄已验证
      },
    });

    console.log("数据库写入成功:", profile);

    // --- 📝 Record Rate Limit ---
    if (ip !== "unknown") {
      await prisma.rateLimit.create({
        data: {
          ip: ip,
          action: "register"
        }
      });
    }
    // ---------------------------

    return NextResponse.json({ success: true, profile });

  } catch (error: any) {
    console.error('Create profile API error:', error);
    
    // 双重保险：捕获 Prisma 的唯一性约束错误 (P2002)
    if (error.code === 'P2002') {
       const target = error.meta?.target;
       
       // 🚨 特殊处理：如果是 ID 冲突，说明数据库 Trigger 可能已经自动写入了数据
       // 这种情况下，我们视为注册成功，而不是报错
       if (!target || (Array.isArray(target) && target.includes('id'))) {
          console.log("⚠️ 检测到 ID 冲突，推测 Trigger 已自动写入 Profile，视为成功。");
          return NextResponse.json({ success: true, message: "Profile created automatically" });
       }

       if (Array.isArray(target)) {
         if (target.includes('email')) return NextResponse.json({ error: '该邮箱已被注册，请直接登录。' }, { status: 409 });
         if (target.includes('full_name')) return NextResponse.json({ error: '该全名已被占用，请更换一个。' }, { status: 409 });
       }
       return NextResponse.json({ error: '用户信息已存在（邮箱或全名重复）。' }, { status: 409 });
    }

    if (error.code === 'P2003') {
       return NextResponse.json({ 
         error: '写入失败：用户 ID 异常，请检查 Supabase 配置。' 
       }, { status: 500 });
    }

    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}