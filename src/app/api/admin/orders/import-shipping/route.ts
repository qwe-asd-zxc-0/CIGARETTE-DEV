import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { sendShippingUpdateEmail } from "@/lib/email";
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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    for (const row of rows) {
      // 尝试匹配列名 (兼容导出时的列名)
      const orderId = row["订单号 (Order ID)"] || row["Order ID"] || row["orderId"] || row["id"];
      const carrier = row["物流公司 (Carrier)"] || row["Carrier"] || row["carrierName"] || row["carrier"];
      const trackingNumber = row["运单号 (Tracking Number)"] || row["Tracking Number"] || row["trackingNumber"] || row["tracking"];
      const trackingUrl = row["查询链接 (Tracking URL)"] || row["Tracking URL"] || row["trackingUrl"] || row["url"];

      if (!orderId || !trackingNumber) {
        // 如果关键信息缺失，跳过
        if (orderId) {
            failCount++;
            errors.push(`Order ${orderId}: Missing tracking number`);
        }
        continue;
      }

      try {
        // 检查订单是否存在
        const existingOrder = await prisma.order.findUnique({ where: { id: String(orderId) } });
        if (!existingOrder) {
            failCount++;
            errors.push(`Order ${orderId}: Not found`);
            continue;
        }

        // 更新订单
        const updatedOrder = await prisma.order.update({
          where: { id: String(orderId) },
          data: {
            carrierName: String(carrier || ""),
            trackingNumber: String(trackingNumber),
            trackingUrl: String(trackingUrl || ""),
            status: "shipped" // 自动更新为已发货
          },
          include: { user: true }
        });

        // 发送邮件 (异步，不阻塞)
        sendShippingUpdateEmail(updatedOrder).catch(e => console.error(`Email failed for ${orderId}`, e));

        successCount++;
      } catch (e: any) {
        console.error(e);
        failCount++;
        errors.push(`Order ${orderId}: ${e.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `处理完成。成功: ${successCount}, 失败: ${failCount}`,
      errors 
    });

  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
