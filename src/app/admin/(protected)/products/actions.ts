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
    const category = formData.get("category") as string; // ✅ 新增：分类字段
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const brandIdRaw = formData.get("brandId");
    const brandId = brandIdRaw ? Number(brandIdRaw) : null;
    
    // ✅ 新增：获取库存数量
    const stockRaw = formData.get("stock");
    const stock = stockRaw ? parseInt(stockRaw.toString()) : 0;

    console.log(`📦 [UpsertProduct] Stock received: ${stock}, Raw: ${stockRaw}`);

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
    const dataPayload: any = {
      title,
      basePrice,
      origin,
      category: category || null,
      description,
      coverImageUrl,
      images,
      specifications,
      tieredPricingRules,
      status: status || 'active',
      stockQuantity: stock,
      // ✅ 扁平化新增字段
      skuCode: generateAutoSKU(title), // 默认生成一个 SKU
      flavor: "Default",
      nicotineStrength: "N/A"
    };

    // ✅ 处理品牌关联
    if (brandId) {
      dataPayload.brand = { connect: { id: brandId } };
    } else {
      if (productId && productId !== "new") {
         dataPayload.brand = { disconnect: true };
      }
    }

    if (productId && productId !== "new") {
      // === 更新模式 ===
      console.log(`🔄 Updating product: ${productId}`);
      
      // 移除 skuCode 更新，避免覆盖已有 SKU
      delete dataPayload.skuCode;

      await prisma.product.update({
        where: { id: productId },
        data: dataPayload,
      });

      // 3. 强制刷新缓存
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${productId}`);

    } else {
      // === 创建模式 ===
      const slug = generateSlug(title);
      console.log(`✨ Creating product with slug: ${slug}`);
      
      await prisma.product.create({
        data: { ...dataPayload, slug },
      });
    }

    revalidatePath("/admin/products");
    revalidatePath("/product");
    
    return { success: true, message: "保存成功" };

  } catch (error: any) {
    console.error("❌ Save error:", error);
    return { success: false, message: error.message };
  }
}

export async function deleteProduct(productId: string) {
  try {
    // 1. 检查是否有订单关联
    const productWithOrders = await prisma.product.findFirst({
      where: {
        id: productId,
        orderItems: { some: {} }
      }
    });

    if (productWithOrders) {
      return { success: false, message: "该商品已有订单记录，无法物理删除。请尝试将其状态改为下架。" };
    }

    // 2. 删除商品本身
    await prisma.product.delete({
      where: { id: productId }
    });

    revalidatePath("/admin/products");
    
    return { success: true, message: "删除成功" };

  } catch (error: any) {
    console.error("Delete error:", error);
    return { success: false, message: "删除失败: " + error.message };
  }
}

export async function updateProductStatus(productId: string, newStatus: string) {
  try {
    await prisma.product.update({
      where: { id: productId },
      data: { status: newStatus }
    });
    revalidatePath("/admin/products");
    return { success: true, message: "状态已更新" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}