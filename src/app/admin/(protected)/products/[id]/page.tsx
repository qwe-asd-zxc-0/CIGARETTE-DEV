import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/products/ProductForm"; 

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isCreate = id === "new";
  
  let product = null;

  // ✅ 新增步骤 1: 获取所有品牌列表 (用于前端下拉框)
  // 我们只取 id 和 name 即可
  const brands = await prisma.brand.findMany({
    orderBy: { name: 'asc' }, // 按名称排序
    select: { id: true, name: true }
  });

  // 编辑模式：查询已有商品数据
  if (!isCreate) {
    const rawProduct = await prisma.product.findUnique({
      where: { id },
      include: { variants: true } // ✅ 必须包含变体，否则无法读取库存
    });
    
    if (!rawProduct) return notFound();

    // 数据整形
    product = {
      ...rawProduct,
      basePrice: Number(rawProduct.basePrice), // 转换 basePrice
      price: Number(rawProduct.basePrice), 
      createdAt: rawProduct.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: (rawProduct as any).updatedAt?.toISOString() || rawProduct.createdAt?.toISOString() || new Date().toISOString(),
      variants: rawProduct.variants.map(v => ({
        ...v,
        price: v.price ? Number(v.price) : 0
      }))
    };
  }

  // ✅ 新增步骤 2: 将 brands 传给组件
  return <ProductForm product={product} isCreate={isCreate} brands={brands} />;
}