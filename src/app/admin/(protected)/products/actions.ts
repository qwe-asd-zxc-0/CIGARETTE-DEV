"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 辅助: 生成 URL Slug
function generateSlug(title: string) {
  let safeTitle = title.trim().replace(/\s+/g, '-').toLowerCase();
  if (!safeTitle) safeTitle = "prod";
  return `${safeTitle}-${Date.now().toString().slice(-4)}`;
}

// 辅助: 自动生成 SKU
function generateAutoSKU(title: string) {
  const prefix = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 4) || "ITEM";
  return `${prefix}-DEFAULT-${Date.now().toString().slice(-6)}`;
}

// 辅助: 解析 JSON
function parseJsonField(jsonStr: string | null, defaultValue: any) {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("JSON parse error:", error);
    return defaultValue;
  }
}

export async function upsertProduct(formData: FormData, productId?: string) {
  try {
    // 1. 获取基本字段
    const title = formData.get("title") as string;
    const priceRaw = formData.get("price") as string;
    const origin = formData.get("origin") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const brandIdRaw = formData.get("brandId");
    const brandId = brandIdRaw ? Number(brandIdRaw) : null;
    
    // ✅ 新增：获取库存数量
    const stockRaw = formData.get("stock");
    const stock = stockRaw ? parseInt(stockRaw.toString()) : 0;

    // 2. 获取其他字段
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const imagesJson = formData.get("images") as string;
    const specsJson = formData.get("specifications") as string;
    const pricingJson = formData.get("tieredPricingRules") as string;

    // 3. 数据转换
    const basePrice = parseFloat(priceRaw) || 0;
    const images = parseJsonField(imagesJson, []);
    const specifications = parseJsonField(specsJson, {});
    const tieredPricingRules = parseJsonField(pricingJson, []);

    // Product 表基础数据
    const dataPayload = {
      title,
      basePrice,
      origin,
      description,
      brandId: brandId || null,
      coverImageUrl,
      images,
      specifications,
      tieredPricingRules,
      status: status || 'active'
    };

    if (productId && productId !== "new") {
      // === 更新模式 ===
      console.log(`🔄 Updating product: ${productId}`);
      
      // 1. 更新商品主信息
      await prisma.product.update({
        where: { id: productId },
        data: dataPayload,
      });

      // 2. ✅ 同步更新库存
      // 逻辑：尝试更新该商品下所有“默认变体”的库存。
      // 如果您主要销售单规格商品，这非常有效。如果是多规格，通常需要去库存页管理。
      await prisma.productVariant.updateMany({
        where: { 
          productId: productId,
          flavor: "Default" // 限制只更新默认变体，防止误伤多规格数据
        },
        data: { stockQuantity: stock }
      });

    } else {
      // === 创建模式 ===
      const slug = generateSlug(title);
      console.log(`✨ Creating product with slug: ${slug}`);
      
      // 1. 创建商品
      const newProduct = await prisma.product.create({
        data: { ...dataPayload, slug },
      });

      // 2. ✅ 创建默认变体（带库存）
      await prisma.productVariant.create({
        data: {
          productId: newProduct.id,
          skuCode: generateAutoSKU(title),
          flavor: "Default",
          nicotineStrength: "N/A",
          price: basePrice,
          stockQuantity: stock,    // 🔥 这里写入您提交的库存
          variantImageUrl: coverImageUrl,
          isActive: true
        }
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory"); // 同时刷新库存列表
    revalidatePath("/product");
    
    return { success: true, message: "保存成功" };

  } catch (error: any) {
    console.error("❌ Save error:", error);
    return { success: false, message: error.message };
  }
}