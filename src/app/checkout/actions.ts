"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. 获取用户收货地址 (用于结算页下拉选择)
// ==========================================
export async function getUserAddresses() {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return []; // 未登录返回空数组

  // 从数据库查询该用户的地址列表
  const addresses = await prisma.userAddress.findMany({
    where: { userId: user.id },
    orderBy: { isDefault: 'desc' } // 默认地址排前面
  });

  return addresses;
}

// ==========================================
// 2. 创建新订单 (核心下单逻辑)
// ==========================================
export async function createOrder(orderData: {
  items: any[];          // 购物车商品列表
  shippingAddress: any;  // 收货地址对象 (JSON)
  totalAmount: number;   // 总金额
  subtotalAmount: number;// 小计
}) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("Unauthorized: Please log in to place an order.");
  }

  // 🚀 开启事务：确保主订单和订单项同时写入成功
  const order = await prisma.$transaction(async (tx) => {
    
    // A. 创建主订单 (Order)
    const newOrder = await tx.order.create({
      data: {
        userId: user.id,
        guestEmail: user.email, // 记录下单账号的邮箱
        status: "pending_payment", // 初始状态：待支付
        subtotalAmount: orderData.subtotalAmount,
        totalAmount: orderData.totalAmount,
        shippingCost: 0, // 暂时免运费，后续可扩展
        shippingAddress: orderData.shippingAddress, // 保存地址快照 JSON
        // id 会自动生成 UUID
      }
    });

    // B. 创建订单项 (OrderItem)
    // 遍历购物车商品，逐个写入
    for (const item of orderData.items) {
      await tx.orderItem.create({
        data: {
          orderId: newOrder.id,
          // 购物车中的 item.id 实际上是 variantId
          productVariantId: item.id, 
          
          // 🔥 关键：保存商品快照，防止后续商品改名/改价影响历史订单
          productTitleSnapshot: item.title,
          // 将口味和浓度合并保存，方便展示
          flavorSnapshot: `${item.flavor} | ${item.strength}`,
          
          quantity: item.quantity,
          unitPrice: item.price
        }
      });

      // (可选) 扩展：在这里扣减库存
      // await tx.productVariant.update({ 
      //   where: { id: item.id }, 
      //   data: { stockQuantity: { decrement: item.quantity } } 
      // });
    }

    return newOrder;
  });

  // C. 刷新数据
  revalidatePath("/profile/orders"); // 刷新订单列表页
  
  return order;
}