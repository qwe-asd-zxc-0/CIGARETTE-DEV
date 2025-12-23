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
    // ✅ 包含分类字段的完整模拟数据
    const products = await Promise.all([
      // === Disposable 分类（一次性电子烟）===
      prisma.product.create({
        data: {
          title: 'Elf Bar BC5000 Disposable Vape',
          slug: 'elf-bar-bc5000',
          category: 'Disposable',
          origin: 'China',
          description: 'Elf Bar BC5000 一次性电子烟，5000口，多种口味可选，便携设计，即用即抛。',
          basePrice: 24.99,
          coverImageUrl: 'https://picsum.photos/id/10/400/500',
          status: 'active',
          brandId: brands[0].id,
          variants: {
            create: [
              {
                flavor: 'Blue Razz Ice',
                price: 24.99,
                stockQuantity: 150,
                nicotineStrength: '5%',
                skuCode: 'ELF-BC5000-BRI',
              },
              {
                flavor: 'Strawberry Mango',
                price: 24.99,
                stockQuantity: 120,
                nicotineStrength: '5%',
                skuCode: 'ELF-BC5000-SM',
              },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          title: 'Lost Mary OS5000 Disposable',
          slug: 'lost-mary-os5000',
          category: 'Disposable',
          origin: 'China',
          description: 'Lost Mary OS5000 一次性电子烟，5000口超大容量，时尚外观，口感丰富。',
          basePrice: 26.99,
          coverImageUrl: 'https://picsum.photos/id/11/400/500',
          status: 'active',
          brandId: brands[1].id,
          variants: {
            create: [
              {
                flavor: 'Watermelon Ice',
                price: 26.99,
                stockQuantity: 200,
                nicotineStrength: '5%',
                skuCode: 'LM-OS5000-WI',
              },
              {
                flavor: 'Peach Mango',
                price: 26.99,
                stockQuantity: 180,
                nicotineStrength: '5%',
                skuCode: 'LM-OS5000-PM',
              },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          title: 'Geek Bar Pulse 15000',
          slug: 'geek-bar-pulse-15000',
          category: 'Disposable',
          origin: 'China',
          description: 'Geek Bar Pulse 15000 超大容量一次性电子烟，15000口，可充电设计，超长续航。',
          basePrice: 29.99,
          coverImageUrl: 'https://picsum.photos/id/12/400/500',
          status: 'active',
          brandId: brands[2].id,
          variants: {
            create: [
              {
                flavor: 'Sour Apple',
                price: 29.99,
                stockQuantity: 100,
                nicotineStrength: '5%',
                skuCode: 'GB-P15000-SA',
              },
            ],
          },
        },
      }),

      // === E-Liquid 分类（烟油）===
      prisma.product.create({
        data: {
          title: 'Naked 100 E-Liquid - Hawaiian POG',
          slug: 'naked-100-hawaiian-pog',
          category: 'E-Liquid',
          origin: 'USA',
          description: 'Naked 100 经典烟油，Hawaiian POG 口味，60ml，70/30 VG/PG，多种尼古丁浓度可选。',
          basePrice: 19.99,
          coverImageUrl: 'https://picsum.photos/id/13/400/500',
          status: 'active',
          brandId: brands[0].id,
          variants: {
            create: [
              {
                flavor: 'Hawaiian POG',
                price: 19.99,
                stockQuantity: 80,
                nicotineStrength: '3mg',
                skuCode: 'NKD100-HPOG-3MG',
              },
              {
                flavor: 'Hawaiian POG',
                price: 19.99,
                stockQuantity: 90,
                nicotineStrength: '6mg',
                skuCode: 'NKD100-HPOG-6MG',
              },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          title: 'Vapetasia Killer Kustard E-Liquid',
          slug: 'vapetasia-killer-kustard',
          category: 'E-Liquid',
          origin: 'USA',
          description: 'Vapetasia Killer Kustard 香草卡士达烟油，60ml，浓郁奶香，口感顺滑。',
          basePrice: 18.99,
          coverImageUrl: 'https://picsum.photos/id/14/400/500',
          status: 'active',
          brandId: brands[1].id,
          variants: {
            create: [
              {
                flavor: 'Killer Kustard',
                price: 18.99,
                stockQuantity: 150,
                nicotineStrength: '3mg',
                skuCode: 'VPT-KK-3MG',
              },
            ],
          },
        },
      }),
      prisma.product.create({
        data: {
          title: 'Jam Monster Strawberry E-Liquid',
          slug: 'jam-monster-strawberry',
          category: 'E-Liquid',
          origin: 'USA',
          description: 'Jam Monster 草莓果酱烟油，100ml，浓郁果香，搭配黄油吐司口感。',
          basePrice: 22.99,
          coverImageUrl: 'https://picsum.photos/id/15/400/500',
          status: 'active',
          brandId: brands[2].id,
          variants: {
            create: [
              {
                flavor: 'Strawberry',
                price: 22.99,
                stockQuantity: 120,
                nicotineStrength: '3mg',
                skuCode: 'JM-STR-3MG',
              },
              {
                flavor: 'Strawberry',
                price: 22.99,
                stockQuantity: 110,
                nicotineStrength: '6mg',
                skuCode: 'JM-STR-6MG',
              },
            ],
          },
        },
      }),

      // === Traditional 分类（传统烟草产品，可选）===
      prisma.product.create({
        data: {
          title: 'Marlboro Red 100s',
          slug: 'marlboro-red-100s',
          category: 'Traditional',
          origin: 'USA',
          description: 'Marlboro Red 100s 传统香烟，经典红标，浓郁口感。',
          basePrice: 12.99,
          coverImageUrl: 'https://picsum.photos/id/16/400/500',
          status: 'active',
          brandId: brands[0].id,
          variants: {
            create: [
              {
                flavor: 'Original',
                price: 12.99,
                stockQuantity: 200,
                nicotineStrength: 'Regular',
                skuCode: 'MB-RED-100',
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