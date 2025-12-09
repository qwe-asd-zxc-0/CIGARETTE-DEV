"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

// 初始化 Supabase Admin 客户端 (需要 Service Role Key)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// 1. 发送密码重置邮件
export async function sendPasswordResetEmail(email: string) {
  try {
    // 使用 admin.generateLink 生成链接 (也可以直接用 resetPasswordForEmail 发送)
    // 这里我们直接调用 resetPasswordForEmail，Supabase 会自动发邮件
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/account/update-password`,
    });

    if (error) throw error;

    return { success: true, message: `Reset email sent to ${email}` };
  } catch (error: any) {
    console.error("Reset password error:", error);
    return { success: false, message: error.message || "Failed to send reset email" };
  }
}

// 2. 切换管理员状态 (保持不变)
export async function toggleAdminStatus(userId: string, currentStatus: boolean) {
  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { isAdmin: !currentStatus },
    });
    revalidatePath("/admin/users");
    return { success: true, message: "Admin status updated" };
  } catch (error) {
    return { success: false, message: "Failed to update status" };
  }
}

// 3. 切换年龄验证状态 (保持不变)
export async function toggleAgeVerified(userId: string, currentStatus: boolean) {
  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { isAgeVerified: !currentStatus },
    });
    revalidatePath("/admin/users");
    return { success: true, message: "Age verification updated" };
  } catch (error) {
    return { success: false, message: "Failed to update status" };
  }
}