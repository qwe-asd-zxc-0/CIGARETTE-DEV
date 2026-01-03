"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cookieStore = await cookies();
  const headersList = await headers();

  // --- 🛡️ Rate Limit Check (Brute Force Protection) ---
  const ip = headersList.get("x-forwarded-for")?.split(',')[0].trim() || "unknown";
  const MAX_ATTEMPTS = 5;
  const WINDOW_MINUTES = 15;

  if (ip !== "unknown") {
    const attempts = await prisma.rateLimit.count({
      where: {
        ip: ip,
        action: "admin_login_fail",
        createdAt: {
          gte: new Date(Date.now() - WINDOW_MINUTES * 60 * 1000)
        }
      }
    });

    if (attempts >= MAX_ATTEMPTS) {
      return { error: "尝试次数过多，请 15 分钟后再试。" };
    }
  }
  // ----------------------------------------------------

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    }
  );

  // 1. 尝试登录 Supabase
  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !user) {
    // 🛡️ 记录失败尝试
    if (ip !== "unknown") {
      await prisma.rateLimit.create({
        data: {
          ip: ip,
          action: "admin_login_fail"
        }
      });
    }
    return { error: "Invalid credentials" };
  }

  // 2. 登录成功后，立即检查是否为管理员
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile || !profile.isAdmin) {
    // 如果不是管理员，立即登出，并报错
    await supabase.auth.signOut();
    // 🛡️ 非管理员尝试登录后台，也视为一种攻击/违规，记录下来
    if (ip !== "unknown") {
      await prisma.rateLimit.create({
        data: {
          ip: ip,
          action: "admin_login_fail" // 或者 "admin_login_unauthorized"
        }
      });
    }
    return { error: "访问被拒绝：您不是管理员。" };
  }

  // 3. 全部通过，跳转后台
  redirect("/admin");
}