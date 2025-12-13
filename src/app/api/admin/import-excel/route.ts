import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
      // 1. 读取基础字段
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

      // 2. 🔥 智能组装: 规格参数
      const specifications: Record<string, string> = {};
      if (row['规格:口数 (Puffs)']) specifications['Puffs'] = String(row['规格:口数 (Puffs)']);
      if (row['规格:容量 (Capacity)']) specifications['Capacity'] = String(row['规格:容量 (Capacity)']);
      if (row['规格:电池 (Battery)']) specifications['Battery'] = String(row['规格:电池 (Battery)']);

      // 3. 🔥 智能组装: 阶梯定价
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
      let product = await prisma.product.findFirst({
        where: { 
            title: { equals: title, mode: 'insensitive' },
            brandId: brand.id 
        }
      });

      // ✅ 从 Excel 中读取分类（如果有 Category 列）
      const category = (row['Category'] || row['分类'] || '').toString().trim() || null;

      if (!product) {
        product = await prisma.product.create({
          data: {
            title,
            slug: productSlugCandidate,
            basePrice: price,
            description,
            origin,
            category, // ✅ 新增：分类字段
            coverImageUrl,
            tieredPricingRules,
            specifications,
            brandId: brand.id,
            status: 'active'
          }
        });
      } else {
        await prisma.product.update({
            where: { id: product.id },
            data: { tieredPricingRules, specifications, coverImageUrl, category: category || undefined }
        });
      }

      // C. 变体 (SKU)
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
            skuCode,
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