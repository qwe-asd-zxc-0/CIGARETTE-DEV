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
  
  // 序列化 Decimal
  return users.map(user => ({
    ...user,
    fullName: typeof user.fullName === 'object' ? JSON.stringify(user.fullName) : user.fullName,
    email: typeof user.email === 'object' ? JSON.stringify(user.email) : user.email,
    balance: user.balance ? Number(user.balance) : 0
  }));
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
    // 1. 数据库清理 (使用事务确保原子性)
    await prisma.$transaction(async (tx) => {
      // (1) 删除关联地址
      await tx.userAddress.deleteMany({ where: { userId } });
      
      // (2) 删除关联评论
      await tx.review.deleteMany({ where: { userId } });

      // (3) 解绑订单 (保留订单数据，但断开与用户的关联)
      // 注意：如果您的业务逻辑要求删除订单，请改为 deleteMany
      await tx.order.updateMany({
        where: { userId },
        data: { userId: null } 
      });

      // (4) 删除 Profile
      // 使用 deleteMany 而不是 delete，以防记录已经被触发器删除而不报错
      await tx.profile.deleteMany({ where: { id: userId } });
    });

    // 2. 从 Supabase Auth 删除
    // 注意：如果 Auth 删除失败，数据库操作已经完成。
    // 理想情况下 Auth 删除也应该在事务中，但 Supabase Admin API 是独立的。
    // 通常 Auth 删除失败概率较低，除非 ID 不存在。
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) {
      console.error("Supabase Auth delete error:", error);
      // 不抛出错误，因为数据库数据已清理，视为"软成功"或提示警告
    }

    revalidatePath("/admin/users");
    return { success: true, message: "用户及关联数据已删除" };
  } catch (error: any) {
    console.error("Delete user error:", error);
    return { success: false, message: "删除失败: " + error.message };
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

// ================= 7. 获取用户详细信息 =================
export async function getUserDetails(userId: string) {
  try {
    const user = await prisma.profile.findUnique({
      where: { id: userId },
      include: {
        addresses: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            items: {
              include: {
                product: {
                  select: { title: true, images: true }
                }
              }
            }
          }
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            product: {
              select: { title: true }
            }
          }
        }
      }
    });

    if (!user) return { success: false, message: "User not found" };

    // 序列化 Decimal
    const serializedUser = {
      ...user,
      fullName: typeof user.fullName === 'object' ? JSON.stringify(user.fullName) : user.fullName,
      email: typeof user.email === 'object' ? JSON.stringify(user.email) : user.email,
      balance: user.balance ? Number(user.balance) : 0,
      addresses: user.addresses.map(addr => ({
        ...addr,
        country: typeof addr.country === 'object' ? (addr.country as any).en || JSON.stringify(addr.country) : addr.country,
        city: typeof addr.city === 'object' ? JSON.stringify(addr.city) : addr.city,
        state: typeof addr.state === 'object' ? JSON.stringify(addr.state) : addr.state,
        addressLine1: typeof addr.addressLine1 === 'object' ? JSON.stringify(addr.addressLine1) : addr.addressLine1,
        addressLine2: typeof addr.addressLine2 === 'object' ? JSON.stringify(addr.addressLine2) : addr.addressLine2,
        firstName: typeof addr.firstName === 'object' ? JSON.stringify(addr.firstName) : addr.firstName,
        lastName: typeof addr.lastName === 'object' ? JSON.stringify(addr.lastName) : addr.lastName,
      })),
      orders: user.orders.map(order => ({
        ...order,
        subtotalAmount: Number(order.subtotalAmount),
        shippingCost: order.shippingCost ? Number(order.shippingCost) : 0,
        totalAmount: Number(order.totalAmount),
        items: order.items.map(item => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          product: item.product ? {
            ...item.product,
            title: typeof item.product.title === 'object' ? (item.product.title as any).en || JSON.stringify(item.product.title) : item.product.title
          } : null
        }))
      })),
      reviews: user.reviews.map(review => ({
        ...review,
        product: review.product ? {
          ...review.product,
          title: typeof review.product.title === 'object' ? (review.product.title as any).en || JSON.stringify(review.product.title) : review.product.title
        } : null
      }))
    };

    return { success: true, data: serializedUser };
  } catch (error) {
    console.error("获取用户详情失败:", error);
    return { success: false, message: "获取用户详情失败" };
  }
}