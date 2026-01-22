import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// 辅助: 生成 URL Slug (带随机数，用于商品)
function generateSlug(text: string) {
  if (!text) return `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') + `-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
}

// 辅助: 生成稳定的 Brand Slug (不带随机数，用于品牌去重)
function generateStableSlug(text: string) {
  if (!text) return 'brand-unknown';
  return text.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// 🔥 核心: 自动生成 SKU
// 规则: BRAND(3)-TITLE(3)-FLAVOR(3)-TIMESTAMP(4) (大写)
function generateAutoSKU(brand: string, title: string, flavor: string, strength: string) {
  const clean = (str: string) => str.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  
  const b = clean(brand).substring(0, 3) || "GEN";
  const t = clean(title).substring(0, 4) || "PROD";
  const f = clean(flavor).substring(0, 3) || "VAR";
  // 增加随机数防止重复
  const suffix = Date.now().toString().slice(-5) + Math.floor(Math.random() * 100);
  
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

    // 🛡️ 防御 DoS: 检查 Content-Length
    const contentLength = parseInt(request.headers.get('content-length') || '0');
    if (contentLength > 20 * 1024 * 1024) { // Excel 限制 20MB
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });

    // 🛡️ 二次检查: 检查实际文件大小
    if (file.size > 10 * 1024 * 1024) { // 限制 10MB
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // 🛡️ 安全检查: 验证 Excel 文件头 (Magic Number)
    const isExcel = (buf: Buffer) => {
      const header = buf.toString('hex', 0, 4);
      // XLSX (ZIP): 504b0304
      // XLS (OLE): d0cf11e0
      return header === '504b0304' || header === 'd0cf11e0';
    };

    if (!isExcel(buffer)) {
      return NextResponse.json({ error: 'Invalid file type. Only Excel files (.xlsx, .xls) are allowed.' }, { status: 400 });
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    console.log(`📊 解析到 ${rows.length} 行数据，开始智能入库...`);

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        const send = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
        };

        // 发送开始信号
        send({ type: 'start', total: rows.length });

        let successCount = 0;
        let processedCount = 0;

        for (const row of rows) {
          try {
            // 1. 读取基础字段
            const brandName = (row['品牌 (Brand)'] || row['Brand'] || '').toString().trim();
            
            // ✅ 支持多语言标题
            const titleEn = (row['商品名称 (Product Title)'] || row['Product Title'] || row['Product Title (EN)'] || '').toString().trim();
            const titleZh = (row['商品名称 (中文) (Product Title ZH)'] || row['商品名称 (中文)'] || row['Product Title (ZH)'] || '').toString().trim();
            
            // 构造 Title JSON
            const titleObj: any = {};
            if (titleEn) titleObj.en = titleEn;
            if (titleZh) titleObj.zh = titleZh;
            
            // 如果都没有，跳过
            if (Object.keys(titleObj).length === 0) {
              processedCount++;
              send({ type: 'progress', current: processedCount, total: rows.length, success: successCount });
              continue;
            }

            // ✅ 兼容旧代码：定义主标题
            const title = titleObj.en || titleObj.zh || "Product";

            const flavorEn = (row['口味 (Flavor)'] || row['Flavor'] || 'Default').toString().trim();
            const flavorZh = (row['口味 (中文) (Flavor ZH)'] || row['口味 (中文)'] || row['Flavor (ZH)'] || '').toString().trim();
            const flavorObj = { en: flavorEn, zh: flavorZh };

            const strength = (row['尼古丁浓度 (Strength)'] || row['Strength'] || 'N/A').toString().trim();
            
            // 如果关键信息缺失，跳过
            if (!brandName) {
              processedCount++;
              send({ type: 'progress', current: processedCount, total: rows.length, success: successCount });
              continue;
            }

            const price = parseFloat(row['基础零售价 (Price)'] || row['Price'] || 0);
            const stock = parseInt(row['库存 (Stock)'] || row['Stock'] || 0);
            const origin = (row['产地 (Origin)'] || row['Origin'] || '').toString();
            const coverImageUrl = (row['封面图URL (Cover Image)'] || row['Cover Image'] || '').toString();
            
            // ✅ 支持多语言描述
            const descEn = (row['描述 (Description)'] || row['Description'] || row['Description (EN)'] || '').toString();
            const descZh = (row['描述 (中文) (Description ZH)'] || row['描述 (中文)'] || row['Description (ZH)'] || '').toString();
            const descObj = { en: descEn, zh: descZh };

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
            let isAutoSku = false;
            if (!skuCode) {
              skuCode = generateAutoSKU(brandName, title, flavorEn, strength);
              isAutoSku = true;
            }

            // --- 数据库操作 ---

            // A. 品牌
            // 使用稳定 Slug，确保同名品牌只会创建一次
            const brandSlug = generateStableSlug(brandName);
            
            // 构造符合多语言规范的名称对象
            const brandNameObj = { en: brandName, zh: brandName };

            const brand = await prisma.brand.upsert({
              where: { slug: brandSlug },
              update: {}, // 如果存在则不更新，直接返回
              create: { 
                name: brandNameObj, // 存为 JSON 对象
                slug: brandSlug 
              }
            });

            // B. 商品 (SPU/SKU) - 扁平化处理
            
            // ✅ 从 Excel 中读取分类（如果有 Category 列）
            const categoryRaw = (row['分类 (Category)'] || row['Category'] || row['分类'] || '').toString().trim();
            // 自动包装为 JSON 格式 { en: "...", zh: "..." } 以匹配数据库结构 (中英文相同)
            // 使用 undefined 而不是 null，这样如果 Excel 中为空，则不更新该字段 (保持原值)
            const category = categoryRaw ? { en: categoryRaw, zh: categoryRaw } : undefined;

            // 🔍 查找现有商品逻辑优化
            // 1. 优先尝试用 SKU 查找 (如果是用户填写的)
            let existingProduct = null;
            if (!isAutoSku) {
              existingProduct = await prisma.product.findUnique({ where: { skuCode } });
            }

            // 2. 如果没找到 (或 SKU 是自动生成的)，尝试用 [标题(中/英) + 品牌] 查找
            // 这样可以防止重复导入同名商品
            if (!existingProduct) {
              const titleMatchConditions = [];
              if (titleObj.en) titleMatchConditions.push({ title: { path: ['en'], equals: titleObj.en } });
              if (titleObj.zh) titleMatchConditions.push({ title: { path: ['zh'], equals: titleObj.zh } });

              if (titleMatchConditions.length > 0) {
                existingProduct = await prisma.product.findFirst({
                  where: {
                    brandId: brand.id,
                    OR: titleMatchConditions
                  }
                });
              }
            }

            // 如果找到了现有商品，但我们之前生成了新的 SKU (isAutoSku)，
            // 我们应该沿用现有商品的 SKU，而不是用新的。
            if (existingProduct && isAutoSku) {
              skuCode = existingProduct.skuCode || skuCode;
            }

            if (existingProduct) {
              // UPDATE: 更新现有 SKU
              await prisma.product.update({
                where: { id: existingProduct.id },
                data: {
                  title: titleObj,
                  basePrice: price,
                  description: descObj,
                  origin,
                  category,
                  coverImageUrl,
                  tieredPricingRules,
                  specifications,
                  brandId: brand.id,
                  flavor: flavorObj,
                  nicotineStrength: strength,
                  stockQuantity: stock
                }
              });
            } else {
              // CREATE: 创建新 SKU
              // 生成唯一的 Slug
              const slugBase = `${title}-${flavorEn}-${strength}`;
              const newSlug = generateSlug(slugBase);

              await prisma.product.create({
                data: {
                  title: titleObj,
                  slug: newSlug,
                  basePrice: price,
                  description: descObj,
                  origin,
                  category,
                  coverImageUrl,
                  tieredPricingRules,
                  specifications,
                  brandId: brand.id,
                  status: 'active',
                  skuCode,
                  flavor: flavorObj,
                  nicotineStrength: strength,
                  stockQuantity: stock
                }
              });
            }
            
            successCount++;
          } catch (err) {
            console.error("Row processing error:", err);
          }

          processedCount++;
          // 每处理 1 条发送一次进度 (如果数据量大，可以改为每 10 条发送一次)
          send({ type: 'progress', current: processedCount, total: rows.length, success: successCount });
        }

        // 发送完成信号
        send({ type: 'complete', total: rows.length, success: successCount });
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { 'Content-Type': 'text/event-stream' }
    });

  } catch (error: any) {
    console.error('Import Error:', error);
    // 🛡️ 安全修复: 生产环境隐藏详细错误信息
    const message = process.env.NODE_ENV === 'production'
      ? 'Import failed'
      : (error.message || 'Import failed');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
