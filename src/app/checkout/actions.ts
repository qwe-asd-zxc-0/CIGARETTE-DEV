"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// === 获取用户地址 ===
export async function getUserAddresses() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const addresses = await prisma.userAddress.findMany({
      where: { userId: user.id },
      orderBy: { isDefault: 'desc' } 
    });

    return addresses.map(addr => ({
      id: addr.id,
      firstName: addr.firstName || "", 
      lastName: addr.lastName || "",   
      phoneNumber: addr.phoneNumber,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault
    }));
  } catch (error) {
    console.error("Fetch addresses error:", error);
    return [];
  }
}

// === 🔥 创建订单 Action (最终修复版) ===
export async function createOrder(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  // 1. 验证用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: "请先登录" };
  }

  // 2. 解析商品数据
  const itemsJson = formData.get("items") as string;
  const clientItems = itemsJson ? JSON.parse(itemsJson) : [];
  if (clientItems.length === 0) {
    return { success: false, message: "购物车为空" };
  }

  // 3. 准备地址数据
  const rawFirstName = formData.get("firstName") as string;
  const rawLastName = formData.get("lastName") as string;
  
  const shippingAddress = {
    fullName: formData.get("fullName") as string,
    phone: formData.get("phone") as string,
    addressLine1: formData.get("addressLine1") as string,
    addressLine2: (formData.get("addressLine2") as string) || "",
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    postalCode: formData.get("postalCode") as string,
    country: formData.get("country") as string,
  };

  // 4. 计算金额 & 准备订单项
  let orderItemsData = [];
  let subtotal = 0;

  for (const item of clientItems) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: item.productVariantId },
      include: { product: true }
    });

    if (!variant) return { success: false, message: `商品失效 ID: ${item.productVariantId}` };
    
    // ✅ 修复 1: 检查库存时使用 correct 字段名 (stockQuantity)
    // 注意: stockQuantity 在数据库中可能为空，给个默认值 0
    const currentStock = variant.stockQuantity ?? 0;
    if (currentStock < item.quantity) {
        return { success: false, message: `${variant.product.title} 库存不足` };
    }

    const unitPrice = Number(variant.price);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItemsData.push({
      productVariant: {
        connect: { id: variant.id }
      },
      quantity: item.quantity,
      unitPrice: unitPrice,
      productTitleSnapshot: variant.product.title,
      flavorSnapshot: variant.flavorName || "Default",
    });
  }

  const shippingCost = 0;
  const totalAmount = subtotal + shippingCost;

  try {
    // 5. 自动保存地址逻辑
    const addressCount = await prisma.userAddress.count({ where: { userId: user.id } });
    const existingAddress = await prisma.userAddress.findFirst({
      where: {
        userId: user.id,
        addressLine1: shippingAddress.addressLine1,
        zipCode: shippingAddress.postalCode,
        firstName: rawFirstName,
        lastName: rawLastName
      }
    });

    let shouldSaveAddress = false;
    if (addressCount < 5 && !existingAddress) {
      shouldSaveAddress = true;
    }

    // 6. 数据库事务执行
    const order = await prisma.$transaction(async (tx) => {
      // (1) 创建订单
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: "pending_payment",
          subtotalAmount: subtotal,
          shippingCost: shippingCost,
          totalAmount: totalAmount,
          currency: "USD",
          shippingAddress: shippingAddress as any,
          items: {
            create: orderItemsData 
          }
        }
      });

      // (2) 扣减库存
      for (const item of clientItems) {
        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { 
            // ✅ 修复 2: 扣减库存时使用 correct 字段名 (stockQuantity)
            stockQuantity: { decrement: item.quantity } 
          }
        });
      }

      // (3) 保存地址
      if (shouldSaveAddress) {
        await tx.userAddress.create({
          data: {
            userId: user.id,
            firstName: rawFirstName,
            lastName: rawLastName,
            phoneNumber: shippingAddress.phone, 
            addressLine1: shippingAddress.addressLine1,
            addressLine2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            zipCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            isDefault: addressCount === 0 
          }
        });
      }

      return newOrder;
    });

    revalidatePath("/profile/orders");
    return { success: true, message: "订单创建成功", orderId: order.id };

  } catch (error: any) {
    console.error("Create order error:", error);
    return { success: false, message: "订单创建失败: " + error.message };
  }
}