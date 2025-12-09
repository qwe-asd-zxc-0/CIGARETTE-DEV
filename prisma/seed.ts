// prisma/seed.ts
import 'dotenv/config';
import { Prisma, PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set; seed aborted.');
}

// Prisma 7 需要在运行时提供连接串；类型定义暂未暴露 datasourceUrl，这里显式断言
const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
} as Prisma.PrismaClientOptions);

async function seed() {
  try {
    // 1. 先清空现有数据（可选，避免重复，首次运行可注释）
    // await prisma.product.deleteMany({});
    // await prisma.brand.deleteMany({});

    // 2. 创建测试品牌（适配你的数据模型）
    const brands = await Promise.all([
      prisma.brand.create({
        data: {
          name: 'Marlboro',
          logoUrl: 'https://picsum.photos/id/1/200/200', // 占位图
          description: 'Famous international tobacco brand',
          slug: 'marlboro',
        },
      }),
      prisma.brand.create({
        data: {
          name: 'Camel',
          logoUrl: 'https://picsum.photos/id/2/200/200',
          description: 'Classic tobacco brand with rich flavor',
          slug: 'camel',
        },
      }),
      prisma.brand.create({
        data: {
          name: 'L&M',
          logoUrl: 'https://picsum.photos/id/3/200/200',
          description: 'Affordable and popular tobacco brand',
          slug: 'l-and-m',
        },
      }),
    ]);

    // 3. 创建测试商品（关联品牌，适配你的 Product 模型）
    const products = await Promise.all([
      prisma.product.create({
        data: {
          title: 'Marlboro Red 100s',
          slug: 'marlboro-red-100s',
          basePrice: 12.99,
          coverImageUrl: 'https://picsum.photos/id/10/400/500',
          status: 'active', // 上架状态
          brandId: brands[0].id, // 关联 Marlboro 品牌
          variants: {
            create: [
              {
                flavor: 'Original',
                price: 12.99,
                stockQuantity: 150,
                nicotineStrength: '5%',
              },
              {
                flavor: 'Menthol',
                price: 13.99,
                stockQuantity: 120,
                nicotineStrength: '3%',
              },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          title: 'Camel Blue Light',
          slug: 'camel-blue-light',
          basePrice: 11.99,
          coverImageUrl: 'https://picsum.photos/id/11/400/500',
          status: 'active',
          brandId: brands[1].id, // 关联 Camel 品牌
          variants: {
            create: [
              {
                flavor: 'Light',
                price: 11.99,
                stockQuantity: 200,
                nicotineStrength: '3%',
              },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          title: 'L&M Bold',
          slug: 'l-and-m-bold',
          basePrice: 9.99,
          coverImageUrl: 'https://picsum.photos/id/12/400/500',
          status: 'active',
          brandId: brands[2].id, // 关联 L&M 品牌
          variants: {
            create: [
              {
                flavor: 'Bold',
                price: 9.99,
                stockQuantity: 300,
                nicotineStrength: '5%',
              },
            ],
          },
        },
      }),
    ]);

    console.log('✅ 种子数据创建成功！');
    console.log(`✅ 已创建：${brands.length} 个品牌 | ${products.length} 个商品`);
  } catch (error) {
    console.error('❌ 种子数据创建失败：', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect(); // 关闭数据库连接
  }
}

// 执行种子脚本
seed();