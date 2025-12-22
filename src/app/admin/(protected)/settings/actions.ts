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
// ... 之前的 import 和函数 ...

// ================= 系统配置 =================

// 获取系统设置
export async function getSystemSetting(key: string) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key },
  });
  return setting?.value || null;
}

// 保存系统设置
export async function saveSystemSetting(key: string, value: any) {
  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value, description: "Activity Configuration" },
    });
    revalidatePath("/"); // 刷新首页
    revalidatePath("/admin/settings");
    return { success: true, message: "Settings saved successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to save settings" };
  }
}
// ================= 活动历史记录 (新增) =================

// 1. 获取所有历史活动
export async function getCampaignHistory() {
  const campaigns = await prisma.marketingCampaign.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return campaigns;
}

// 2. 保存当前配置到历史记录
export async function saveCampaignToHistory(data: any) {
  try {
    await prisma.marketingCampaign.create({
      data: {
        title: data.title,
        subtitle: data.subtitle,
        imageUrl: data.imageUrl,
        buttonText: data.buttonText,
        linkUrl: data.linkUrl,
      }
    });
    revalidatePath("/admin/settings");
    return { success: true, message: "已添加到历史记录" };
  } catch (error) {
    return { success: false, message: "保存失败" };
  }
}

// 3. 删除历史记录
export async function deleteCampaign(id: string) {
  try {
    await prisma.marketingCampaign.delete({ where: { id } });
    revalidatePath("/admin/settings");
    return { success: true, message: "记录已删除" };
  } catch (error) {
    return { success: false, message: "删除失败" };
  }
}

// ================= 邮件日志 =================

export async function getEmailLogs() {
  try {
    const logs = await prisma.emailLog.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 emails
    });
    return { success: true, data: logs };
  } catch (error) {
    console.error('Failed to fetch email logs:', error);
    return { success: false, error: 'Failed to fetch email logs' };
  }
}