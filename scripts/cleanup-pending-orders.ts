import { prisma } from "@/lib/prisma";

async function main() {
  console.log("🧹 Starting cleanup of pending orders...");

  // 1. 定义超时时间 (例如 30 分钟)
  const TIMEOUT_MINUTES = 30;
  const cutoffTime = new Date(Date.now() - TIMEOUT_MINUTES * 60 * 1000);

  // 2. 查找所有超时且未支付的订单
  // 注意：目前的业务逻辑是“支付即创建”，所以理论上不会有 pending_payment 且占用了库存的订单。
  // 但如果未来引入了“先下单后支付”逻辑，这个脚本就非常有用了。
  // 假设 pending_payment 状态意味着库存已被锁定但未支付。
  
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: "pending_payment",
      createdAt: {
        lt: cutoffTime
      }
    },
    include: {
      items: true
    }
  });

  console.log(`Found ${pendingOrders.length} pending orders to cancel.`);

  for (const order of pendingOrders) {
    try {
      await prisma.$transaction(async (tx) => {
        // (1) 归还库存
        for (const item of order.items) {
          if (item.productId) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: { increment: item.quantity }
              }
            });
          }
        }

        // (2) 标记订单为已取消
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: "cancelled",
            cancelReason: "Payment timeout"
          }
        });
      });
      console.log(`✅ Order ${order.id} cancelled and stock restored.`);
    } catch (error) {
      console.error(`❌ Failed to cancel order ${order.id}:`, error);
    }
  }

  console.log("🎉 Cleanup finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
