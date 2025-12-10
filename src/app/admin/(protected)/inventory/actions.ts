"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. 更新库存数量
export async function updateStock(variantId: string, newQuantity: number) {
  try {
    if (newQuantity < 0) throw new Error("Stock cannot be negative");

    await prisma.productVariant.update({
      where: { id: variantId },
      data: { stockQuantity: newQuantity },
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Stock updated successfully" };
  } catch (error) {
    console.error("Update stock error:", error);
    return { success: false, message: "Failed to update stock" };
  }
}

// 2. 触发补货通知
export async function notifySubscribers(variantId: string) {
  try {
    // 查找该变体所有未通知的订阅
    const subscriptions = await prisma.restockSubscription.findMany({
      where: { 
        productVariantId: variantId, 
        isNotified: false 
      },
    });

    if (subscriptions.length === 0) {
      return { success: false, message: "No pending subscriptions found." };
    }

    // TODO: 在这里集成邮件发送服务 (如 Resend / Nodemailer)
    // await sendRestockEmail(subscriptions.map(s => s.email));
    console.log(`[Mock Email] Sending restock notification to ${subscriptions.length} users for variant ${variantId}`);

    // 标记为已通知
    await prisma.restockSubscription.updateMany({
      where: { 
        productVariantId: variantId, 
        isNotified: false 
      },
      data: { isNotified: true },
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: `Successfully notified ${subscriptions.length} subscribers.` };
  } catch (error) {
    console.error("Notify error:", error);
    return { success: false, message: "Failed to send notifications." };
  }
}