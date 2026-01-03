import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    // --- 🛡️ 安全检查 Start ---
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // 1. 验证登录
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. 验证管理员权限
    const profile = await prisma.profile.findUnique({
      where: { id: user.id },
      select: { isAdmin: true }
    });

    if (!profile || !profile.isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }
    // --- 🛡️ 安全检查 End ---

    const { orderIds } = await req.json();

    // 如果没有提供 ID，则导出所有订单（或者前端应该处理全选逻辑传所有ID？为了性能，如果全选，前端可能只传一个 flag）
    // 这里简单处理：如果有 IDs 则过滤，否则导出所有（或者报错，看需求。通常导出所有比较危险，但对于管理员还好）
    // 让我们假设前端会传递 IDs。如果 IDs 为空数组，则不导出任何东西。
    
    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
       return NextResponse.json({ error: "No orders selected" }, { status: 400 });
    }

    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        user: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 转换数据为扁平格式
    const rows = orders.map(order => {
      const address = order.shippingAddress as any || {};
      
      // 格式化商品信息
      const itemsStr = order.items.map((item: any) => {
        const title = typeof item.productTitleSnapshot === 'object' 
            ? (item.productTitleSnapshot?.en || JSON.stringify(item.productTitleSnapshot))
            : item.productTitleSnapshot;
        return `${title} (x${item.quantity})`;
      }).join('; ');

      return {
        "订单号 (Order ID)": order.id,
        "下单日期 (Date)": order.createdAt ? new Date(order.createdAt).toISOString().split('T')[0] : '',
        "状态 (Status)": order.status,
        "总金额 (Total Amount)": Number(order.totalAmount),
        "货币 (Currency)": order.currency,
        "客户姓名 (Customer Name)": order.user?.fullName || `${address.firstName || ''} ${address.lastName || ''}`.trim() || 'Guest',
        "邮箱 (Email)": order.user?.email || order.guestEmail,
        "电话 (Phone)": address.phone || address.phoneNumber,
        "收货地址 (Address)": `${address.addressLine1} ${address.addressLine2 || ''}, ${address.city}, ${address.state} ${address.zipCode}, ${address.country}`,
        "商品明细 (Items)": itemsStr,
        "物流公司 (Carrier)": order.carrierName || '',
        "运单号 (Tracking Number)": order.trackingNumber || '',
        "查询链接 (Tracking URL)": order.trackingUrl || ''
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="orders-export-${Date.now()}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
