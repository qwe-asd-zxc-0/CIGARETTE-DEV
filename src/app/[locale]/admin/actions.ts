"use server";

import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function adminLogin(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const cookieStore = await cookies();

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
    return { error: "Invalid credentials" };
  }

  // 2. 登录成功后，立即检查是否为管理员
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
  });

  if (!profile || !profile.isAdmin) {
    // 如果不是管理员，立即登出，并报错
    await supabase.auth.signOut();
    return { error: "访问被拒绝：您不是管理员。" };
  }

  // 3. 全部通过，跳转后台
  redirect("/admin");
}