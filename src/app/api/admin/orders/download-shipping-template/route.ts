import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // 定义模板列头
    const headers = [
      {
        "订单号 (Order ID)": "示例: 123e4567-e89b...",
        "物流公司 (Carrier)": "DHL",
        "运单号 (Tracking Number)": "1234567890",
        "查询链接 (Tracking URL)": "https://www.dhl.com/..."
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(headers);
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 40 }, // Order ID
      { wch: 15 }, // Carrier
      { wch: 25 }, // Tracking Number
      { wch: 40 }  // Tracking URL
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Shipping Template");

    const buf = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="shipping-import-template.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: "Template generation failed" }, { status: 500 });
  }
}
