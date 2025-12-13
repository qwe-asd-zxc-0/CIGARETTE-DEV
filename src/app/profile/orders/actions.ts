"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 定义地址的数据结构
export interface ShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export async function updateOrderAddress(orderId: string, newAddress: ShippingAddress) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  // 1. 验证用户登录
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "请先登录" };

  // 2. 查询订单状态
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return { success: false, message: "订单不存在" };
  if (order.userId !== user.id) return { success: false, message: "无权操作此订单" };

  // 3. 🛡️ 关键检查：只有“待支付”或“已支付(未发货)”状态可以修改地址
  // 如果已经发货(shipped)、完成(completed)或取消(cancelled)，则禁止修改
  if (["shipped", "completed", "cancelled"].includes(order.status || "")) {
    return { success: false, message: "当前订单状态无法修改地址" };
  }

  // 4. 更新数据库
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { 
        shippingAddress: newAddress as any //由于Prisma Json类型的缘故，这里强制转一下
      },
    });
    
    // 刷新页面数据
    revalidatePath("/profile/orders");
    return { success: true, message: "地址已更新" };
  } catch (error) {
    console.error("Update address error:", error);
    return { success: false, message: "更新失败，请重试" };
  }
}