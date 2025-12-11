"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

// 生成 Slug (支持中文)
function generateSlug(title: string) {
  let safeTitle = title.trim().replace(/\s+/g, '-');
  if (!safeTitle) safeTitle = "product";
  // 添加时间戳后缀防止重复
  return `${safeTitle}-${Date.now().toString().slice(-4)}`;
}

export async function upsertProduct(formData: FormData, productId?: string) {
  console.log("🚀 Starting upsertProduct..."); // 添加日志

  try {
    const title = formData.get("title") as string;
    const priceRaw = formData.get("price") as string;
    const origin = formData.get("origin") as string;
    const description = formData.get("description") as string;
    const status = formData.get("status") as string;
    const imagesJson = formData.get("images") as string;

    console.log("📦 Received data:", { title, priceRaw, origin }); // 添加日志

    const priceInput = parseFloat(priceRaw);
    if (isNaN(priceInput)) {
      return { success: false, message: "❌ 价格格式错误，请输入有效数字。" };
    }

    const images = imagesJson ? JSON.parse(imagesJson) : [];
    
    // 生成 slug
    const slug = generateSlug(title || "new-product");

    // 构造基础数据
    const baseData = {
      title,
      basePrice: priceInput,
      origin,
      description,
      status,
      images, // 确保 prisma schema 中有 images String[]
    };

    if (productId && productId !== "new") {
      // === 更新 ===
      console.log("🔄 Updating product:", productId);
      await prisma.product.update({
        where: { id: productId },
        data: baseData,
      });
    } else {
      // === 创建 ===
      console.log("✨ Creating product with slug:", slug);
      await prisma.product.create({
        data: {
          ...baseData,
          slug: slug, // ✅ 必填项
        },
      });
    }

    console.log("✅ Database operation successful");

  } catch (error: any) {
    console.error("❌ Product save error:", error);
    // 返回具体的错误信息
    return { success: false, message: `保存失败: ${error.message}` };
  }

  // 成功后的操作 (必须在 try/catch 之外，否则 redirect 会被 catch 捕获)
  revalidatePath("/admin/products");
  revalidatePath("/product");
  redirect("/admin/products");
}