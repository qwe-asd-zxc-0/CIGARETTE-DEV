import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // 1. 定义表头和一行示例数据
    const headers = [
      'Brand', 'Product Title', 'Description', 'Price', 'Image', 'SKU Code', 'Flavor', 'Strength', 'Stock'
    ];

    const sampleData = [
      {
        'Brand': 'ELFBAR',
        'Product Title': 'ElfBar BC5000',
        'Description': '5000 Puffs Disposable Vape',
        'Price': 18.99,
        'Image': 'https://example.com/image.jpg',
        'SKU Code': 'EB-BC5000-WM',
        'Flavor': 'Watermelon Ice',
        'Strength': '5%',
        'Stock': 100
      }
    ];

    // 2. 创建工作表 (Worksheet)
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

    // 3. 设置列宽 (让表格好看一点)
    worksheet['!cols'] = [
      { wch: 15 }, // Brand
      { wch: 30 }, // Title
      { wch: 30 }, // Desc
      { wch: 10 }, // Price
      { wch: 40 }, // Image
      { wch: 20 }, // SKU
      { wch: 20 }, // Flavor
      { wch: 10 }, // Strength
      { wch: 10 }, // Stock
    ];

    // 4. 创建工作簿 (Workbook)
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');

    // 5. 生成二进制流
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // 6. 返回文件下载响应
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="product_import_template.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('Download template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}