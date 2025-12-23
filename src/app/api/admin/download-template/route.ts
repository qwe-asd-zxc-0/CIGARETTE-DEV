import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    // 1. 定义表头 (更直观的中文列名)
    // 注意：不再需要用户填写 JSON，也不强制填写 SKU
    const headers = [
      '品牌 (Brand)', 
      '商品名称 (Product Title)', 
      '商品名称 (中文) (Product Title ZH)', // ✅ 新增
      '口味 (Flavor)', 
      '口味 (中文) (Flavor ZH)', // ✅ 新增
      '尼古丁浓度 (Strength)', 
      '库存 (Stock)',
      '基础零售价 (Price)', 
      '产地 (Origin)', 
      '分类 (Category)', // ✅ 新增
      '封面图URL (Cover Image)', 
      
      // --- 常用规格拆分 (后台自动组装) ---
      '规格:口数 (Puffs)',
      '规格:容量 (Capacity)',
      '规格:电池 (Battery)',
      
      // --- 阶梯批发价拆分 (后台自动组装) ---
      '批发:数量1 (Qty 1)', '批发:单价1 (Price 1)',
      '批发:数量2 (Qty 2)', '批发:单价2 (Price 2)',
      '批发:数量3 (Qty 3)', '批发:单价3 (Price 3)',

      '描述 (Description)',
      '描述 (中文) (Description ZH)', // ✅ 新增
      '自定义SKU (选填)' // 放在最后，不填则自动生成
    ];

    const sampleData = [
      {
        '品牌 (Brand)': 'ELFBAR',
        '商品名称 (Product Title)': 'BC5000',
        '商品名称 (中文) (Product Title ZH)': 'BC5000 电子烟',
        '口味 (Flavor)': 'Watermelon Ice',
        '口味 (中文) (Flavor ZH)': '西瓜冰',
        '尼古丁浓度 (Strength)': '5%',
        '库存 (Stock)': 500,
        '基础零售价 (Price)': 18.99,
        '产地 (Origin)': 'China',
        '分类 (Category)': 'Disposable',
        '封面图URL (Cover Image)': 'https://example.com/img.jpg',
        
        // 规格示例
        '规格:口数 (Puffs)': '5000',
        '规格:容量 (Capacity)': '13ml',
        '规格:电池 (Battery)': '650mAh',

        // 阶梯价示例
        '批发:数量1 (Qty 1)': 10, '批发:单价1 (Price 1)': 15.00,
        '批发:数量2 (Qty 2)': 50, '批发:单价2 (Price 2)': 13.50,
        '批发:数量3 (Qty 3)': 100, '批发:单价3 (Price 3)': 12.00,

        '描述 (Description)': 'Best selling disposable vape.',
        '描述 (中文) (Description ZH)': '热销一次性电子烟。',
        '自定义SKU (选填)': '' // 留空演示自动生成
      }
    ];

    // 2. 创建工作表
    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });

    // 3. 设置列宽 (优化视觉体验)
    worksheet['!cols'] = [
      { wch: 15 }, // Brand
      { wch: 25 }, // Title
      { wch: 25 }, // Title ZH
      { wch: 20 }, // Flavor
      { wch: 20 }, // Flavor ZH
      { wch: 10 }, // Strength
      { wch: 10 }, // Stock
      { wch: 12 }, // Price
      { wch: 10 }, // Origin
      { wch: 15 }, // Category
      { wch: 25 }, // Image
      
      { wch: 15 }, // Puffs
      { wch: 15 }, // Capacity
      { wch: 15 }, // Battery
      
      { wch: 8 }, { wch: 8 }, // Tier 1
      { wch: 8 }, { wch: 8 }, // Tier 2
      { wch: 8 }, { wch: 8 }, // Tier 3
      
      { wch: 30 }, // Desc
      { wch: 30 }, // Desc ZH
      { wch: 20 }, // SKU
    ];

    // 4. 生成文件
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Import Template');
    const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="product_import_template_v3.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    });

  } catch (error) {
    console.error('Download template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}