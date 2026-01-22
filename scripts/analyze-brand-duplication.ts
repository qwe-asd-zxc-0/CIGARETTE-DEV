
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);

// 不使用 adapter，直接连接尝试
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function analyzeBrands() {
  console.log('开始分析品牌数据...');
  try {
    // 获取所有品牌及其关联的产品数量
    const brands = await prisma.brand.findMany({
      include: {
        _count: {
          select: { products: true }
        }
      }
    });

    console.log(`数据库中共有 ${brands.length} 个品牌记录。`);

    // 按名称分组
    const nameGroups = new Map<string, typeof brands>();

    for (const brand of brands) {
      // 尝试解析名称，假设是 JSON 格式，我们主要关注英文名或整个对象字符串
      let nameKey = '';
      try {
        if (typeof brand.name === 'object' && brand.name !== null) {
            // @ts-ignore
            nameKey = brand.name['en'] || JSON.stringify(brand.name);
        } else {
            nameKey = String(brand.name);
        }
      } catch (e) {
        nameKey = String(brand.name);
      }
      
      // 归一化：去除首尾空格，转小写（可选，视情况而定）
      nameKey = nameKey.trim();

      if (!nameGroups.has(nameKey)) {
        nameGroups.set(nameKey, []);
      }
      nameGroups.get(nameKey)?.push(brand);
    }

    // 分析重复情况
    let duplicateGroups = 0;
    let singleProductBrands = 0;

    console.log('\n--- 重复品牌分析 ---');
    for (const [name, group] of nameGroups) {
      if (group.length > 1) {
        duplicateGroups++;
        console.log(`\n品牌名称: "${name}" 共有 ${group.length} 条记录:`);
        group.forEach(b => {
          console.log(`  - ID: ${b.id}, 关联产品数: ${b._count.products}`);
          if (b._count.products === 1) singleProductBrands++;
        });
      } else {
          if (group[0]._count.products === 1) singleProductBrands++;
      }
    }

    console.log('\n--- 总结 ---');
    console.log(`总品牌记录数: ${brands.length}`);
    console.log(`唯一品牌名称数: ${nameGroups.size}`);
    console.log(`存在重复记录的品牌名称数: ${duplicateGroups}`);
    
    if (duplicateGroups > 0) {
        console.log(`\n结论: 确实存在数据冗余。同一个品牌名称对应了多个不同的品牌ID。`);
        console.log(`这通常是因为在导入或创建产品时，没有检查品牌是否已存在，而是直接创建了新品牌记录。`);
    } else {
        console.log(`\n结论: 未发现明显的品牌名称重复。`);
    }

  } catch (error) {
    console.error('分析出错:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeBrands();
