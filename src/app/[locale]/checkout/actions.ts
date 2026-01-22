"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getTranslations, getLocale } from 'next-intl/server';
import { getTrans } from '@/lib/i18n-utils';
import { sendOrderConfirmationEmail } from "@/lib/email";

// ❌ 删除：getUserAddresses 函数 (游客模式不需要)

// === 🔥 创建订单 Action (游客版) ===
export async function createOrder(formData: FormData) {
  const t = await getTranslations('Checkout');
  const locale = await getLocale();

  // 1. 获取并验证邮箱 (这是游客唯一的身份凭证)
  const email = formData.get("email") as string;
  if (!email || !email.includes('@')) {
    return { success: false, message: "Valid email is required" };
  }

  // 2. 解析商品数据
  const itemsJson = formData.get("items") as string;
  const clientItems = itemsJson ? JSON.parse(itemsJson) : [];
  if (clientItems.length === 0) {
    return { success: false, message: t('cartEmptyAlert') };
  }

  // 3. 准备地址数据 (直接存入 JSON，不关联 UserAddress 表)
  const shippingAddress = {
    firstName: formData.get("firstName") as string,
    lastName: formData.get("lastName") as string,
    phone: formData.get("phone") as string,
    addressLine1: formData.get("addressLine1") as string,
    addressLine2: (formData.get("addressLine2") as string) || "",
    city: formData.get("city") as string,
    state: formData.get("state") as string,
    postalCode: formData.get("postalCode") as string,
    country: formData.get("country") as string,
  };

  // 4. 预处理订单项 (验证库存 & 价格)
  const orderItemsData = [];
  let estimatedTotal = 0;

  for (const item of clientItems) {
    if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
       return { success: false, message: "Invalid item quantity" };
    }

    // 兼容 productVariantId 或 productId
    const pid = item.productVariantId || item.productId;
    const product = await prisma.product.findUnique({
      where: { id: pid },
    });
    
    if (!product) return { success: false, message: t('productInvalid', { id: pid }) };

    if (product.status !== 'active') {
       return { success: false, message: t('productUnavailable', { title: getTrans(product.title as any, locale) }) };
    }
    if (product.stockQuantity < item.quantity) {
       return { success: false, message: t('stockInsufficient', { title: getTrans(product.title as any, locale) }) };
    }
    
    const unitPrice = Number(product.basePrice);
    estimatedTotal += unitPrice * item.quantity;

    orderItemsData.push({
      productId: product.id, 
      quantity: item.quantity,
      unitPrice: unitPrice,
      productTitleSnapshot: product.title,
      flavorSnapshot: product.flavor || "Default",
    });
  }

  const shippingCost = 0; // 暂时免邮

  try {
    // 5. 数据库事务执行 (扣库存 + 创建订单)
    const order = await prisma.$transaction(async (tx) => {
      let finalSubtotal = 0;
      const finalOrderItems = [];

      // (1) 扣减库存 & 计算最终金额
      for (const item of orderItemsData) {
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

      // (2) 创建订单 (关键修改：userId 为 null, guestEmail 为用户填写的 email)
      const newOrder = await tx.order.create({
        data: {
          userId: null,        // ✅ 游客订单
          guestEmail: email,   // ✅ 存入游客邮箱
          status: "pending_payment", 
          subtotalAmount: finalSubtotal,
          shippingCost: shippingCost,
          totalAmount: finalTotalAmount,
          currency: "USD",
          shippingAddress: shippingAddress as any, // 存为 JSON 快照
          items: {
            create: finalOrderItems
          }
        }
      });

      return newOrder;
    });

    // 6. 发送确认邮件
    try {
      // 重新查询以包含关联数据 (items) 传给邮件模板
      const fullOrder = await prisma.order.findUnique({
        where: { id: order.id },
        include: { items: true } 
      });
      
      if (fullOrder) {
        await sendOrderConfirmationEmail(fullOrder);
      }
    } catch (emailErr) {
      console.error("Failed to send confirmation email:", emailErr);
      // 邮件发送失败不应阻断订单流程
    }

    return { success: true, message: t('orderSuccess'), orderId: order.id };

  } catch (error: any) {
    console.error("Create order error:", error);
    const errorMsg = process.env.NODE_ENV === 'production'
      ? 'Internal Error'
      : error.message;
    return { success: false, message: t('orderFailed', { error: errorMsg }) };
  }
}