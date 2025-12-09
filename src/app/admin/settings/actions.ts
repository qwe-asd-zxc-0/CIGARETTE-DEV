"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ================= 权限管理 =================

// 搜索用户 (用于添加管理员)
export async function searchUserByEmail(email: string) {
  if (!email) return { success: false, message: "Email is required" };
  
  const user = await prisma.profile.findUnique({
    where: { email },
    select: { id: true, email: true, fullName: true, avatarUrl: true, isAdmin: true }
  });

  if (!user) return { success: false, message: "User not found" };
  return { success: true, user };
}

// 切换管理员权限
export async function toggleAdminPermission(userId: string, isAdmin: boolean) {
  try {
    await prisma.profile.update({
      where: { id: userId },
      data: { isAdmin },
    });
    revalidatePath("/admin/settings");
    return { success: true, message: `Admin privileges ${isAdmin ? 'granted' : 'revoked'}` };
  } catch (error) {
    return { success: false, message: "Failed to update permissions" };
  }
}

// ================= 合规审计 =================

// 获取最近的年龄验证记录 (由于没有专门的日志表，我们查询 Profile 表的最近更新)
// 注意：实际生产环境建议建立专门的 AuditLog 表
export async function getAgeVerificationLogs() {
  const profiles = await prisma.profile.findMany({
    where: { isAgeVerified: true },
    orderBy: { createdAt: 'desc' }, // 暂以注册时间倒序
    take: 20,
    select: { id: true, email: true, fullName: true, isAgeVerified: true, createdAt: true }
  });
  return profiles;
}

// 获取评论审核日志
export async function getReviewAuditLogs() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: { select: { email: true } },
      product: { select: { title: true } }
    }
  });
  return reviews;
}