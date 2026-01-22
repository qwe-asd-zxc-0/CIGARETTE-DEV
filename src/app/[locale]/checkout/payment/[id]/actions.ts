'use server';

import { prisma } from "@/lib/prisma";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createTrocadorTrade, getEstimatedXmrAmount, getTrocadorTradeStatus } from "@/lib/trocador";

// 1. 初始化支付：计算金额 -> 调用 Trocador -> 更新数据库
export async function initCryptoPayment(orderId: string, coinFrom: string, networkFrom: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get(name) { return cookieStore.get(name)?.value; } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Unauthorized" };

  const order = await prisma.order.findUnique({
    where: { id: orderId, userId: user.id }
  });

  if (!order) return { success: false, message: "Order not found" };
  
  // 如果数据库里已经有针对这个币种的未支付单，直接返回（避免重复创建）
  if (order.paymentId && order.paymentCoin === coinFrom && order.status !== 'paid') {
     return { 
       success: true, 
       paymentAddress: order.paymentAddress, 
       paymentAmount: Number(order.paymentAmount), 
       paymentId: order.paymentId 
     };
  }

  try {
    let targetAmount = Number(order.totalAmount);
    
    // 如果商户配置接收 XMR，我们需要将 USD 转换为 XMR 数量
    if (process.env.MERCHANT_WALLET_TICKER === 'xmr') {
       const estimatedXmr = await getEstimatedXmrAmount(targetAmount);
       if (!estimatedXmr) {
         return { success: false, message: "Failed to fetch exchange rates. Please try again later." };
       }
       targetAmount = estimatedXmr;
    }

    // 调用 Trocador 创建交易
    const trade = await createTrocadorTrade({
      ticker_to: process.env.MERCHANT_WALLET_TICKER!, // 'xmr'
      network_to: process.env.MERCHANT_WALLET_NETWORK!, // 'mainnet'
      address_to: process.env.MERCHANT_WALLET_ADDRESS!, // 你的 XMR 钱包
      ticker_from: coinFrom,   // 用户选的 (如 btc)
      network_from: networkFrom, // (如 mainnet)
      amount_to: targetAmount  // 商户希望收到的 XMR 数量
    });

    if (!trade || !trade.trade_id) {
       return { success: false, message: "Payment provider error" };
    }

    // 更新订单，保存支付信息
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: trade.trade_id,
        paymentAddress: trade.address_from, // 这是给用户看的充值地址 (BTC地址)
        paymentCoin: coinFrom,
        paymentAmount: trade.amount_from,   // 这是用户需要支付的数量 (BTC数量)
      }
    });

    revalidatePath(`/checkout/payment/${orderId}`);
    return { 
      success: true, 
      paymentAddress: trade.address_from, 
      paymentAmount: Number(trade.amount_from), 
      paymentId: trade.trade_id 
    };

  } catch (error) {
    console.error("Init payment error:", error);
    return { success: false, message: "Failed to initialize payment" };
  }
}

// 2. 检查支付状态 (供前端轮询)
export async function checkPaymentStatus(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentId: true, status: true, userId: true, totalAmount: true }
  });

  if (!order || !order.paymentId) return { success: false };
  if (order.status === 'paid') return { success: true, status: 'paid' };

  // 查询 Trocador 状态
  const tradeStatus = await getTrocadorTradeStatus(order.paymentId);
  
  // 状态 'finished' 表示资金已成功交换并发送给商家
  if (tradeStatus && tradeStatus.status === 'finished') {
    // 开启事务：更新订单状态 + 创建交易记录
    await prisma.$transaction(async (tx) => {
      // 检查是否已被并发更新
      const currentOrder = await tx.order.findUnique({ where: { id: orderId } });
      if (currentOrder?.status === 'paid') return;

      await tx.order.update({
        where: { id: orderId },
        data: { status: 'paid' }
      });
      
      if (order.userId) {
        await tx.transaction.create({
          data: {
            userId: order.userId,
            type: "payment",
            amount: order.totalAmount,
            status: "completed",
            description: `Order #${orderId.slice(0, 8)} - Crypto Payment`,
            createdAt: new Date()
          }
        });
      }
    });
    
    revalidatePath(`/checkout/payment/${orderId}`);
    revalidatePath("/profile/orders");
    return { success: true, status: 'paid' };
  }

  return { success: false, status: tradeStatus?.status || 'pending' };
}