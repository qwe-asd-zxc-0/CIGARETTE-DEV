'use server';

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from 'uuid';
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";

/**
 * 登录成功后调用：
 * 1. 生成新的 Session Token
 * 2. 存入数据库
 * 3. 写入 HttpOnly Cookie
 */
export async function recordLoginSession(userId: string) {
  const newToken = uuidv4();
  const cookieStore = await cookies();

  // 1. 更新数据库
  await prisma.profile.update({
    where: { id: userId },
    data: { currentSessionToken: newToken }
  });

  // 2. 写入 Cookie (有效期与 Supabase Token 保持一致或更长，这里设为 7 天)
  cookieStore.set('app_session_token', newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7 
  });
}

/**
 * 检查当前 Session 是否有效 (用于 Layout 或 Middleware)
 * 如果无效，执行登出操作
 */
export async function checkSessionValidity() {
  const cookieStore = await cookies();
  const clientToken = cookieStore.get('app_session_token')?.value;

  // 如果没有 Token，可能是未登录，直接放行 (由 Supabase Auth 负责拦截未登录)
  // 或者如果是强制登录页面，这里可以返回 false
  if (!clientToken) return { valid: true }; 

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { valid: true }; // 未登录状态，不需要踢人

  // 查询数据库中的 Token
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { currentSessionToken: true }
  });

  // 核心判断：如果数据库里的 Token 和 Cookie 里的不一致，说明有新登录
  if (profile?.currentSessionToken && profile.currentSessionToken !== clientToken) {
    return { valid: false, reason: "您的账号已在其他设备登录，您已被强制下线。" };
  }

  return { valid: true };
}
