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

// 取消订单
export async function cancelOrder(orderId: string) {
  try {
    // 1. 检查订单当前状态
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { status: true }
    });

    if (!order) {
      return { success: false, message: "Order not found" };
    }

    if (order.status === 'cancelled') {
      return { success: false, message: "Order is already cancelled" };
    }

    if (order.status === 'completed') {
      return { success: false, message: "Cannot cancel a completed order" };
    }

    // 2. 更新状态为已取消
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'cancelled' },
    });

    revalidatePath("/admin/orders");
    return { success: true, message: "Order cancelled successfully" };
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return { success: false, message: "Failed to cancel order: " + error.message };
  }
}