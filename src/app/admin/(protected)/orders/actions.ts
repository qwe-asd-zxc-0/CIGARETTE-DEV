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
export async function cancelOrder(orderId: string, reason?: string) {
  try {
    // 1. 检查订单当前状态
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
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

    // 2. 开启事务：更新状态 + 退款 + 恢复库存 + 记录流水
    await prisma.$transaction(async (tx) => {
      // (1) 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: { 
          status: 'cancelled',
          cancelReason: reason 
        },
      });

      // (2) 如果订单已支付，执行退款逻辑
      // 假设非 pending_payment 且金额 > 0 即为已支付
      // 注意：Prisma Decimal 需要转为 Number 进行比较
      const orderTotal = Number(order.totalAmount.toString());
      
      if (order.status !== 'pending_payment' && orderTotal > 0) {
        // 退还余额
        await tx.profile.update({
          where: { id: order.userId },
          data: { balance: { increment: order.totalAmount } }
        });

        // 创建退款流水
        await tx.transaction.create({
          data: {
            userId: order.userId,
            type: 'refund',
            amount: order.totalAmount,
            status: 'completed',
            description: `订单退款 #${order.id.slice(0, 8)}`
          }
        });
      }

      // (3) 恢复商品库存
      for (const item of order.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } }
          });
        }
      }
    });

    revalidatePath("/admin/orders");
    // 🔥 强制刷新用户端的缓存，确保用户能立即看到余额和流水变化
    revalidatePath("/profile");
    revalidatePath("/profile/transactions");
    
    return { success: true, message: "Order cancelled and refunded successfully" };
  } catch (error: any) {
    console.error("Cancel order error:", error);
    return { success: false, message: "Failed to cancel order: " + error.message };
  }
}