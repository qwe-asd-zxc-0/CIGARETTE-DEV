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
    const parsed = JSON.parse(jsonStr);
    // 如果解析出来是字符串（例如 JSON.stringify("foo")），则尝试再次解析或直接返回
    if (typeof parsed === 'string') {
        try { return JSON.parse(parsed); } catch { return parsed; }
    }
    return parsed;
  } catch (error) {
    // console.error("JSON parse error:", error); // 可能是普通字符串，不报错
    return defaultValue;
  }
}

export async function upsertProduct(formData: FormData, productId?: string) {
  try {
    // 1. 获取基本字段
    const titleRaw = formData.get("title") as string;
    const descriptionRaw = formData.get("description") as string;
    
    // 解析多语言字段
    // 如果是 JSON 字符串，解析为对象；如果是普通字符串，封装为 { en: ... }
    let titleObj = parseJsonField(titleRaw, null);
    if (!titleObj || typeof titleObj === 'string') {
        titleObj = { en: titleRaw || "Untitled" };
    }

    let descriptionObj = parseJsonField(descriptionRaw, null);
    if (!descriptionObj || typeof descriptionObj === 'string') {
        descriptionObj = { en: descriptionRaw || "" };
    }

    // 提取用于生成 Slug 和 SKU 的主标题 (优先英文)
    const mainTitle = titleObj.en || titleObj.zh || "Product";

    const priceRaw = formData.get("price") as string;
    const origin = formData.get("origin") as string;
    const categoryRaw = formData.get("category") as string; // ✅ 新增：分类字段
    
    // 解析分类字段
    let category = parseJsonField(categoryRaw, null);
    // 如果解析失败（例如是普通字符串 "Disposable"），或者解析结果为空，则手动封装
    if (!category && categoryRaw) {
        category = { en: categoryRaw };
    }

    const status = formData.get("status") as string;
    const brandIdRaw = formData.get("brandId");
    const brandId = brandIdRaw ? Number(brandIdRaw) : null;
    
    // ✅ 新增：获取库存数量
    const stockRaw = formData.get("stock");
    const stock = stockRaw ? parseInt(stockRaw.toString()) : 0;

    // ✅ 新增：获取 SKU, Slug, Flavor, Nicotine
    const skuCodeRaw = formData.get("skuCode") as string;
    const slugRaw = formData.get("slug") as string;
    const flavorRaw = formData.get("flavor") as string;
    const nicotineStrength = formData.get("nicotineStrength") as string;
    const isFeatured = formData.get("isFeatured") === "true";

    let flavorObj = parseJsonField(flavorRaw, null);
    if (!flavorObj || typeof flavorObj === 'string') {
        flavorObj = { en: flavorRaw || "" };
    }

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
      title: titleObj, // ✅ 存入 JSON 对象
      basePrice,
      origin,
      category: category || null,
      description: descriptionObj, // ✅ 存入 JSON 对象
      coverImageUrl,
      images,
      specifications,
      tieredPricingRules,
      status: status || 'active',
      stockQuantity: stock,
      // ✅ 扁平化新增字段
      skuCode: skuCodeRaw || generateAutoSKU(mainTitle), 
      flavor: flavorObj,
      nicotineStrength: nicotineStrength || null,
      slug: slugRaw || generateSlug(mainTitle),
      isFeatured: isFeatured
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
      
      // 如果用户没有提供 SKU/Slug，我们尽量保持原样，或者如果前端传回了原值，就更新为原值
      // 这里 dataPayload 已经包含了 skuCodeRaw || generateAutoSKU
      // 如果前端传回了空字符串，这里会生成新的。
      // 所以前端必须回填 defaultValue。ProductForm 已经做了 defaultValue={product?.skuCode}

      await prisma.product.update({
        where: { id: productId },
        data: dataPayload,
      });

      // 3. 强制刷新缓存
      revalidatePath("/admin/products");
      revalidatePath(`/admin/products/${productId}`);

    } else {
      // === 创建模式 ===
      console.log(`✨ Creating product with slug: ${dataPayload.slug}`);
      
      await prisma.product.create({
        data: dataPayload,
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