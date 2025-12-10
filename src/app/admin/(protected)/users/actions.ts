"use server";

import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase-admin"; // ✅ 引用我们封装好的 Admin 客户端
import { revalidatePath } from "next/cache";

// ================= 1. 读取用户列表 =================
export async function getUsers(query?: string) {
  const where: any = {};
  if (query) {
    where.OR = [
      { email: { contains: query, mode: "insensitive" } },
      { fullName: { contains: query, mode: "insensitive" } },
    ];
  }

  // 获取用户，包含余额信息
  const users = await prisma.profile.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      isAgeVerified: true,
      isAdmin: true,
      balance: true, // ✅ 获取余额
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
  return users;
}

// ================= 2. 创建新用户 =================
export async function createUser(data: any) {
  try {
    // 1. 在 Supabase Auth 中创建账号 (使用 Admin API)
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true, // 自动验证邮箱，无需发送邮件
      user_metadata: { full_name: data.fullName }
    });

    if (authError) throw new Error(authError.message);
    if (!authUser.user) throw new Error("Supabase Auth 创建失败");

    // 2. 在 Prisma Profile 中同步创建业务档案
    // 即使 Supabase 有触发器，手动 upsert 也能保证数据一致性
    await prisma.profile.upsert({
      where: { id: authUser.user.id },
      update: {
        fullName: data.fullName,
        balance: data.balance || 0,
        isAgeVerified: data.isAgeVerified || false,
        isAdmin: false, // 默认不给管理员权限，防止误操作
      },
      create: {
        id: authUser.user.id, // 必须与 Auth ID 一致
        email: data.email,
        fullName: data.fullName,
        balance: data.balance || 0,
        isAgeVerified: data.isAgeVerified || false,
        isAdmin: false,
      },
    });

    revalidatePath("/admin/users");
    return { success: true, message: "用户创建成功" };
  } catch (error: any) {
    console.error("Create user error:", error);
    return { success: false, message: error.message || "创建失败" };
  }
}

// ================= 3. 更新资料 (包含余额、权限) =================
export async function updateUserProfile(userId: string, data: any) {
  try {
    await prisma.profile.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        balance: data.balance, // ✅ 更新余额
        isAgeVerified: data.isAgeVerified,
        isAdmin: data.isAdmin,
      },
    });
    revalidatePath("/admin/users");
    return { success: true, message: "资料更新成功" };
  } catch (error) {
    return { success: false, message: "更新失败" };
  }
}

// ================= 4. 强制重置密码 (无需邮件) =================
export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    // 直接修改 Auth 表中的密码
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (error) throw error;
    return { success: true, message: "密码已强制重置" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ================= 5. 发送重置邮件 (保留原有功能) =================
export async function sendPasswordResetEmail(email: string) {
  try {
    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/account/update-password`,
    });
    if (error) throw error;
    return { success: true, message: `重置邮件已发送至 ${email}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// ================= 6. 删除用户 =================
export async function deleteUser(userId: string) {
  try {
    // 1. 从 Supabase Auth 删除
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) throw error;

    // 2. 从 Prisma 删除 (通常会有级联删除，但为了保险手动执行)
    try {
      await prisma.profile.delete({ where: { id: userId } });
    } catch (e) {
      // 忽略错误，可能是因为 Auth 删除时触发器已经删除了 Profile
    }

    revalidatePath("/admin/users");
    return { success: true, message: "用户已彻底删除" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
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

// 切换年龄验证状态
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