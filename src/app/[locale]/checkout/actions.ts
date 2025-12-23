"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getTranslations } from 'next-intl/server';

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
  let orderItemsData = [];
  let subtotal = 0;

  for (const item of clientItems) {
    // ✅ 扁平化：直接查询 Product 表
    // 注意：前端传来的可能是 productVariantId (旧) 或 productId (新)
    // 这里假设前端已经更新为传 productId，或者我们通过 ID 查找 Product
    const product = await prisma.product.findUnique({
      where: { id: item.productId || item.productVariantId }, // 兼容性处理
    });

    if (!product) return { success: false, message: t('productInvalid', { id: item.productId }) };
    
    // ✅ 检查库存
    const currentStock = product.stockQuantity ?? 0;
    if (currentStock < item.quantity) {
        return { success: false, message: t('stockInsufficient', { title: product.title }) };
    }

    const unitPrice = Number(product.basePrice);
    const lineTotal = unitPrice * item.quantity;
    subtotal += lineTotal;

    orderItemsData.push({
      product: {
        connect: { id: product.id }
      },
      quantity: item.quantity,
      unitPrice: unitPrice,
      productTitleSnapshot: product.title,
      flavorSnapshot: product.flavor || "Default",
    });
  }

  const shippingCost = 0;
  const totalAmount = subtotal + shippingCost;

  try {
    // 4.5 检查用户余额
    const userProfile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { balance: true }
    });

    if (!userProfile) {
      return { success: false, message: t('userNotFound') };
    }

    const currentBalance = Number(userProfile.balance) || 0;
    if (currentBalance < totalAmount) {
      return { success: false, message: t('balanceInsufficient', { amount: totalAmount.toFixed(2), balance: currentBalance.toFixed(2) }) };
    }

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
        // ✅ 扁平化：直接扣减 Product 库存
        await tx.product.update({
          where: { id: item.productId || item.productVariantId },
          data: {
            stockQuantity: { decrement: item.quantity }
          }
        });
      }

      // (3) 扣减用户余额
      await tx.profile.update({
        where: { id: user.id },
        data: {
          balance: {
            decrement: totalAmount
          }
        }
      });

      // (4) 余额扣除成功后，更新订单状态为已支付
      await tx.order.update({
        where: { id: newOrder.id },
        data: {
          status: "paid"
        }
      });

      // (4.5) 🔥 关键修复：创建交易流水记录 (Transaction)
      await tx.transaction.create({
        data: {
          userId: user.id,
          type: "payment", // 交易类型：支付
          amount: totalAmount, // 金额
          status: "completed", // 状态：完成
          description: `订单支付 #${newOrder.id.slice(0, 8)}`, // 描述
          createdAt: new Date()
        }
      });

      // (5) 保存地址
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
    return { success: false, message: t('orderFailed', { error: error.message }) };
  }
}