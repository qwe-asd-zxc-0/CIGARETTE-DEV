'use server';

import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function confirmPayment(orderId: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: user.id }
    });

    if (!order) return { success: false, message: "Order not found" };
    if (order.status === 'paid') return { success: true, message: "Already paid" };

    // 模拟支付验证成功
    // 在真实场景中，这里应该调用区块链 API 检查交易
    
    await prisma.$transaction(async (tx) => {
      // 1. 更新订单状态
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'paid' }
      });

      // 2. 创建交易记录
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "payment",
          amount: order.totalAmount,
          status: "completed",
          description: `Order Payment #${order.id.slice(0, 8)}`,
          createdAt: new Date()
        }
      });
    });

    revalidatePath("/profile/orders");
    return { success: true };
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return { success: false, message: "Payment failed" };
  }
}
