import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// 简单的 Slug 生成辅助函数
function generateSlug(text: string) {
  if (!text) return `unknown-${Date.now()}`;
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // 非字母数字替换为 -
    .replace(/^-+|-+$/g, '');   // 去头尾的 -
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 1. 读取 Excel 文件 buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. 解析 Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // 读取第一个工作表
    const sheet = workbook.Sheets[sheetName];
    
    // 将 Excel 转换为 JSON 数组
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    console.log(`📊 解析到 ${rows.length} 行数据，开始入库...`);

    let successCount = 0;

    for (const row of rows) {
      // --- 读取字段 (增加了类型安全转换) ---
      const brandName = row['Brand'] ? String(row['Brand']).trim() : '';
      const productTitle = row['Product Title'] ? String(row['Product Title']).trim() : '';
      
      // 价格转数字，如果不是数字则为 0
      const basePrice = parseFloat(row['Price']) || 0;
      
      const description = row['Description'] ? String(row['Description']) : '';
      const imageUrl = row['Image'] ? String(row['Image']) : '';
      
      const skuCode = row['SKU Code'] ? String(row['SKU Code']).trim() : '';
      const flavor = row['Flavor'] ? String(row['Flavor']) : 'Default';
      
      // 🔥 关键修复：强制转换为 String，解决 5% 变成 0.05 报错的问题
      let strength = row['Strength'] !== undefined ? String(row['Strength']) : 'N/A';
      
      // 库存转整数
      const stock = parseInt(row['Stock']) || 0;

      if (!brandName || !productTitle || !skuCode) {
        console.warn('⚠️ 跳过数据不完整的行:', row);
        continue; // 跳过这一行
      }

      // --- A. 处理品牌 (Brand) ---
      const brandSlug = generateSlug(brandName);
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: {
          name: brandName,
          slug: brandSlug,
        }
      });

      // --- B. 处理商品 (Product) ---
      const productSlug = generateSlug(productTitle);
      
      let product = await prisma.product.findUnique({
        where: { slug: productSlug }
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            title: productTitle,
            slug: productSlug,
            basePrice: basePrice,
            description: description,
            coverImageUrl: imageUrl,
            brandId: brand.id,
            status: 'active'
          }
        });
      }

      // --- C. 处理 SKU 变体 (Variant) ---
      const existingSku = await prisma.productVariant.findUnique({
        where: { skuCode: skuCode }
      });

      if (existingSku) {
        // 更新库存
        await prisma.productVariant.update({
          where: { id: existingSku.id },
          data: { 
            stockQuantity: stock, 
            price: basePrice, // 可选：更新价格
            nicotineStrength: strength // 更新浓度
          } 
        });
      } else {
        // 创建新 SKU
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            skuCode: skuCode,
            flavor: flavor,
            nicotineStrength: strength, // 这里现在肯定是 String 了
            stockQuantity: stock,
            variantImageUrl: imageUrl, 
            isActive: true
          }
        });
      }
      
      successCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `成功处理 ${successCount} 条数据` 
    });

  } catch (error: any) {
    console.error('Excel Import Error:', error);
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  }
}