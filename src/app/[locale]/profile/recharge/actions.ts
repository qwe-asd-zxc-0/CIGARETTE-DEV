'use server'

import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function rechargeBalance(amount: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "未登录" };

  if (amount <= 0) return { success: false, message: "充值金额必须大于 0" };

  try {
    // 1. 创建交易记录
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: "deposit",
        amount: amount,
        status: "completed",
        description: "账户余额充值"
      }
    });

    // 2. 更新用户余额
    await prisma.profile.update({
      where: { id: user.id },
      data: {
        balance: { increment: amount }
      }
    });

    revalidatePath("/profile");
    return { success: true, message: "充值成功" };
  } catch (error) {
    console.error("Recharge error:", error);
    return { success: false, message: "充值失败，请稍后重试" };
  }
}
