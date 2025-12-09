import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    // 0. ✅ 新增：先检查 email 或 fullName 是否已存在于 Profile 表中
    // 虽然 Supabase Auth 会检查 email，但我们需要在创建之前拦截 fullName 重复的情况
    const existingUser = await prisma.profile.findFirst({
      where: {
        OR: [
          { email: email },
          { fullName: fullName } // 检查用户名重复
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
      }
      if (existingUser.fullName === fullName) {
        return NextResponse.json({ error: 'This Full Name is already taken. Please choose another.' }, { status: 409 });
      }
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
      },
    });

    console.log("数据库写入成功:", profile);

    return NextResponse.json({ success: true, profile });

  } catch (error: any) {
    console.error('Create profile API error:', error);
    
    // 双重保险：捕获 Prisma 的唯一性约束错误 (P2002)
    if (error.code === 'P2002') {
       const target = error.meta?.target;
       if (Array.isArray(target)) {
         if (target.includes('email')) return NextResponse.json({ error: 'This email is already registered.' }, { status: 409 });
         if (target.includes('full_name')) return NextResponse.json({ error: 'This Full Name is already taken.' }, { status: 409 });
       }
       return NextResponse.json({ error: 'User information already exists.' }, { status: 409 });
    }

    if (error.code === 'P2003') {
       return NextResponse.json({ 
         error: 'Write failed: User ID issue. Please check Supabase configuration.' 
       }, { status: 500 });
    }

    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}