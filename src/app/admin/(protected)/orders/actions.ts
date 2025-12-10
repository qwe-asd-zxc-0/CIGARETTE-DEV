"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 更新订单状态
export async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    revalidatePath("/admin/orders");
    return { success: true, message: "Order status updated" };
  } catch (error) {
    return { success: false, message: "Failed to update status" };
  }
}

// 更新物流信息
export async function updateTrackingInfo(
  orderId: string, 
  data: { carrierName: string; trackingNumber: string; trackingUrl: string }
) {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        carrierName: data.carrierName,
        trackingNumber: data.trackingNumber,
        trackingUrl: data.trackingUrl,
        // 如果填了单号且状态还是 pending/paid，自动改为 shipped (可选逻辑)
        // status: "shipped" 
      },
    });
    revalidatePath("/admin/orders");
    return { success: true, message: "Tracking info updated" };
  } catch (error) {
    return { success: false, message: "Failed to update tracking info" };
  }
}