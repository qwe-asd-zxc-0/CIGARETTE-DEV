"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTranslations, getLocale } from 'next-intl/server';
import { getTrans } from '@/lib/i18n-utils';

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

import { sendOrderConfirmationEmail } from "@/lib/email";

// === 🔥 创建订单 Action (最终修复版) ===
export async function createOrder(formData: FormData) {
  const t = await getTranslations('Checkout');
  const locale = await getLocale();
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  // 1. 验证用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, message: t('loginRequired') };
  }

  // 1.5 验证年龄 (新增)
  const profile = await prisma.profile.findUnique({
    where: { id: user.id },
    select: { isAgeVerified: true }
  });

  if (!profile?.isAgeVerified) {
    return { success: false, message: t('ageVerificationRequired') };
  }

  // 2. 解析商品数据
  const itemsJson = formData.get("items") as string;
  const clientItems = itemsJson ? JSON.parse(itemsJson) : [];
  if (clientItems.length === 0) {
    return { success: false, message: t('cartEmptyAlert') };
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
  // 我们将在事务中重新计算和校验，这里仅做预处理
  const orderItemsData: {
    productId: string;
    quantity: number;
    unitPrice: number;
    productTitleSnapshot: any;
    flavorSnapshot: any;
  }[] = [];
  let estimatedTotal = 0;

  for (const item of clientItems) {
    // 🛡️ 安全检查: 强制验证数量为正整数
    // 防止负数攻击 (导致余额增加) 或 0/小数攻击
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1 || !Number.isInteger(item.quantity)) {
       return { success: false, message: "Invalid item quantity" };
    }

    const product = await prisma.product.findUnique({
      where: { id: item.productId || item.productVariantId },
    });
    if (!product) return { success: false, message: t('productInvalid', { id: item.productId }) };

    // 🛡️ 检查商品状态和库存 (预检查)
    if (product.status !== 'active') {
       return { success: false, message: t('productUnavailable', { title: getTrans(product.title as any, locale) }) };
    }
    if (product.stockQuantity < item.quantity) {
       return { success: false, message: t('stockInsufficient', { title: getTrans(product.title as any, locale) }) };
    }
    
    const unitPrice = Number(product.basePrice);
    estimatedTotal += unitPrice * item.quantity;

    orderItemsData.push({
      productId: product.id, // 暂存 ID，事务中使用
      quantity: item.quantity,
      unitPrice: unitPrice,
      productTitleSnapshot: product.title,
      flavorSnapshot: product.flavor || "Default",
    });
  }

  const shippingCost = 0;

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

    // 6. 数据库事务执行 (关键修复：并发安全)
    const order = await prisma.$transaction(async (tx) => {
      let finalSubtotal = 0;
      const finalOrderItems = [];

      // (1) 扣减库存 & 计算最终金额
      for (const item of orderItemsData) {
        // 使用 update 原子操作扣减库存，防止并发超卖
        // 注意：数据库层面最好有 CHECK (stockQuantity >= 0) 约束
        // 如果没有约束，我们需要检查更新后的值
        const updatedProduct = await tx.product.update({
          where: { id: item.productId },
          data: {
            stockQuantity: { decrement: item.quantity }
          }
        });

        if (updatedProduct.stockQuantity < 0) {
          throw new Error(t('stockInsufficient', { title: getTrans(updatedProduct.title as any, locale) }));
        }

        const lineTotal = Number(updatedProduct.basePrice) * item.quantity;
        finalSubtotal += lineTotal;

        finalOrderItems.push({
          product: { connect: { id: item.productId } },
          quantity: item.quantity,
          unitPrice: Number(updatedProduct.basePrice),
          productTitleSnapshot: item.productTitleSnapshot as any,
          flavorSnapshot: item.flavorSnapshot,
        });
      }

      const finalTotalAmount = finalSubtotal + shippingCost;

      // (2) 创建订单 (状态为 pending_payment)
      const newOrder = await tx.order.create({
        data: {
          userId: user.id,
          status: "pending_payment", // 等待支付
          subtotalAmount: finalSubtotal,
          shippingCost: shippingCost,
          totalAmount: finalTotalAmount,
          currency: "USD",
          shippingAddress: shippingAddress as any,
          items: {
            create: finalOrderItems
          }
        }
      });

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
    revalidatePath("/profile/transactions"); // ✅ 刷新交易记录
    revalidatePath("/profile"); // ✅ 刷新余额显示
    
    // 📧 发送确认邮件 (异步发送，不阻塞响应)
    // 注意：在 Serverless 环境中，最好 await 它，或者使用后台任务队列。
    // 这里为了简单直接 await，可能会稍微增加响应时间。
    try {
      // 需要重新查询带 user 信息的 order，或者直接构造
      // 这里简单起见，我们假设 order 对象里有我们需要的信息，或者重新查一次
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true, user: true }
      });
      if (fullOrder) {
        await sendOrderConfirmationEmail(fullOrder);
      }
    } catch (emailErr) {
      console.error("Failed to send confirmation email:", emailErr);
    }

    return { success: true, message: t('orderSuccess'), orderId: order.id };

  } catch (error: any) {
    console.error("Create order error:", error);
    // 🛡️ 安全修复: 生产环境隐藏详细错误信息
    const errorMsg = process.env.NODE_ENV === 'production'
      ? 'Internal Error'
      : error.message;
    return { success: false, message: t('orderFailed', { error: errorMsg }) };
  }
}