import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

// 辅助: 生成 URL Slug
function generateSlug(text: string) {
  if (!text) return `prod-${Date.now()}`;
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-4)}`;
}

// 🔥 核心: 自动生成 SKU
// 规则: BRAND(3)-TITLE(3)-FLAVOR(3)-TIMESTAMP(4) (大写)
function generateAutoSKU(brand: string, title: string, flavor: string, strength: string) {
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  const b = clean(brand).substring(0, 3) || "GEN";
  const t = clean(title).substring(0, 4) || "PROD";
  const f = clean(flavor).substring(0, 3) || "VAR";
  // 增加时间戳后缀防止重复
  const suffix = Date.now().toString().slice(-5);
  
  return `${b}-${t}-${f}-${suffix}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    console.log(`📊 解析到 ${rows.length} 行数据，开始智能入库...`);

    let successCount = 0;

    for (const row of rows) {
      // 1. 读取基础字段 (兼容旧版 Key)
      const brandName = (row['品牌 (Brand)'] || row['Brand'] || '').toString().trim();
      const title = (row['商品名称 (Product Title)'] || row['Product Title'] || '').toString().trim();
      const flavor = (row['口味 (Flavor)'] || row['Flavor'] || 'Default').toString().trim();
      const strength = (row['尼古丁浓度 (Strength)'] || row['Strength'] || 'N/A').toString().trim();
      
      // 如果关键信息缺失，跳过
      if (!brandName || !title) continue;

      const price = parseFloat(row['基础零售价 (Price)'] || row['Price'] || 0);
      const stock = parseInt(row['库存 (Stock)'] || row['Stock'] || 0);
      const origin = (row['产地 (Origin)'] || row['Origin'] || '').toString();
      const coverImageUrl = (row['封面图URL (Cover Image)'] || row['Cover Image'] || '').toString();
      const description = (row['描述 (Description)'] || row['Description'] || '').toString();

      // 2. 🔥 智能组装: 规格参数 (从分散列 -> JSON)
      const specifications: Record<string, string> = {};
      if (row['规格:口数 (Puffs)']) specifications['Puffs'] = String(row['规格:口数 (Puffs)']);
      if (row['规格:容量 (Capacity)']) specifications['Capacity'] = String(row['规格:容量 (Capacity)']);
      if (row['规格:电池 (Battery)']) specifications['Battery'] = String(row['规格:电池 (Battery)']);

      // 3. 🔥 智能组装: 阶梯定价 (从分散列 -> JSON Array)
      const tieredPricingRules = [];
      for (let i = 1; i <= 3; i++) {
        const qty = parseInt(row[`批发:数量${i} (Qty ${i})`] || 0);
        const p = parseFloat(row[`批发:单价${i} (Price ${i})`] || 0);
        if (qty > 0 && p > 0) {
          tieredPricingRules.push({ min: qty, price: p });
        }
      }

      // 4. 🔥 智能生成: SKU
      let skuCode = (row['自定义SKU (选填)'] || row['SKU Code'] || '').toString().trim();
      if (!skuCode) {
        skuCode = generateAutoSKU(brandName, title, flavor, strength);
      }

      // --- 数据库操作 ---

      // A. 品牌
      const brandSlug = generateSlug(brandName);
      const brand = await prisma.brand.upsert({
        where: { slug: brandSlug },
        update: {},
        create: { name: brandName, slug: brandSlug }
      });

      // B. 商品 (SPU)
      const productSlugCandidate = generateSlug(title);
      // 简单查重：按标题查找，如果存在则复用，否则创建
      // 注意：这里为了简化，假设同名即为同一商品。实际可能需要更复杂的逻辑。
      let product = await prisma.product.findFirst({
        where: { 
            title: { equals: title, mode: 'insensitive' }, // 忽略大小写
            brandId: brand.id 
        }
      });

      if (!product) {
        product = await prisma.product.create({
          data: {
            title,
            slug: productSlugCandidate,
            basePrice: price,
            description,
            origin,
            coverImageUrl,
            tieredPricingRules, // ✅ 存入组装好的 JSON
            specifications,     // ✅ 存入组装好的 JSON
            brandId: brand.id,
            status: 'active'
          }
        });
      } else {
        // 更新商品信息 (可选：比如更新阶梯价或封面)
        await prisma.product.update({
            where: { id: product.id },
            data: { tieredPricingRules, specifications, coverImageUrl }
        });
      }

      // C. 变体 (SKU)
      // 使用自动生成的 skuCode 查找或创建
      const existingSku = await prisma.productVariant.findUnique({
        where: { skuCode }
      });

      if (existingSku) {
        await prisma.productVariant.update({
          where: { id: existingSku.id },
          data: { stockQuantity: stock, price: price, nicotineStrength: strength }
        });
      } else {
        await prisma.productVariant.create({
          data: {
            productId: product.id,
            skuCode, // ✅ 使用自动生成的 SKU
            flavor,
            nicotineStrength: strength,
            stockQuantity: stock,
            variantImageUrl: coverImageUrl,
            isActive: true
          }
        });
      }
      successCount++;
    }

    return NextResponse.json({ success: true, message: `成功导入 ${successCount} 个 SKU` });

  } catch (error: any) {
    console.error('Import Error:', error);
    return NextResponse.json({ error: error.message || 'Import failed' }, { status: 500 });
  }
}