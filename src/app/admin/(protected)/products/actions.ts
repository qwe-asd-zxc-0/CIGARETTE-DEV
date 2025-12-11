"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
// ❌ 已移除 redirect 导入，避免在客户端 try/catch 中触发"网络错误"
// import { redirect } from "next/navigation";

// 辅助: 生成 URL Slug
function generateSlug(title: string) {
  let safeTitle = title.trim().replace(/\s+/g, '-').toLowerCase();
  if (!safeTitle) safeTitle = "prod";
  return `${safeTitle}-${Date.now().toString().slice(-4)}`;
}

// 辅助: 自动生成 SKU (用于手动创建商品时)
// 格式: TITLE(4)-DEFAULT-TIMESTAMP(6)
function generateAutoSKU(title: string) {
  // 取标题前4个字母/数字，转大写
  const prefix = title.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 4) || "ITEM";
  // 添加时间戳后缀确保唯一性
  return `${prefix}-DEFAULT-${Date.now().toString().slice(-6)}`;
}

// 辅助: 解析 JSON 字符串，失败返回默认值
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
    const status = formData.get("status") as string; // 获取发布状态
    
    // 处理 BrandID: 如果是空字符串或 0，转为 null
    const brandIdRaw = formData.get("brandId");
    const brandId = brandIdRaw ? Number(brandIdRaw) : null;
    
    // 2. 获取新增字段 (图片、规格、阶梯价)
    const coverImageUrl = formData.get("coverImageUrl") as string;
    const imagesJson = formData.get("images") as string;
    const specsJson = formData.get("specifications") as string;
    const pricingJson = formData.get("tieredPricingRules") as string;

    // 3. 数据类型转换与处理
    const basePrice = parseFloat(priceRaw) || 0;
    const images = parseJsonField(imagesJson, []);
    const specifications = parseJsonField(specsJson, {});
    const tieredPricingRules = parseJsonField(pricingJson, []);

    // 构造写入数据库的基础对象
    const dataPayload = {
      title,
      basePrice,
      origin,
      description,
      brandId: brandId || null,
      coverImageUrl,       // ✅ 保存封面
      images,              // ✅ 保存图集
      specifications,      // ✅ 保存规格
      tieredPricingRules,  // ✅ 保存阶梯价
      status: status || 'active'
    };

    if (productId && productId !== "new") {
      // === 更新模式 ===
      console.log(`🔄 Updating product: ${productId}`);
      await prisma.product.update({
        where: { id: productId },
        data: dataPayload,
      });
    } else {
      // === 创建模式 ===
      const slug = generateSlug(title);
      console.log(`✨ Creating product with slug: ${slug}`);
      
      // A. 创建商品主表 (Product)
      const newProduct = await prisma.product.create({
        data: {
          ...dataPayload,
          slug,
        },
      });

      // B. 🔥 自动创建默认变体 (Variant)
      // 目的：确保创建商品后，在库存管理中能立即看到一条数据（SKU）
      await prisma.productVariant.create({
        data: {
          productId: newProduct.id,
          skuCode: generateAutoSKU(title), // 自动生成 SKU
          flavor: "Default",               // 默认口味
          nicotineStrength: "N/A",         // 默认浓度
          price: basePrice,                // 继承基础价格
          stockQuantity: 0,                // 初始库存 0
          variantImageUrl: coverImageUrl,  // 使用封面图作为变体图
          isActive: true
        }
      });
    }

    // ✅ 关键修改：只刷新缓存，返回成功对象，而不是在服务端 Redirect
    revalidatePath("/admin/products");
    revalidatePath("/product");
    
    return { success: true, message: "保存成功" };

  } catch (error: any) {
    console.error("❌ Save error:", error);
    // 返回错误信息供前端 alert 显示
    return { success: false, message: error.message };
  }
}