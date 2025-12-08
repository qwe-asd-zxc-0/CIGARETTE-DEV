const fs = require('fs');
const path = require('path');

// 定义您需要的文件结构和默认内容
const filesToCreate = [
  {
    path: 'src/app/age-gate/page.tsx',
    content: `export default function AgeGate() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <h1>年龄验证页 (Age Gate)</h1>
      <p>关联功能: 1.0, 数据库: profiles.is_age_verified</p>
    </div>
  );
}`
  },
  {
    path: 'src/app/category/page.tsx',
    content: `export default function CategoryPage() {
  return (
    <div className="p-8">
      <h1>商品分类页</h1>
      <p>关联功能: 2.2, 数据库: products + product_variants</p>
    </div>
  );
}`
  },
  {
    path: 'src/app/product/[id]/page.tsx',
    content: `export default function ProductDetail({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1>商品详情页 (ID: {params.id})</h1>
      <p>关联功能: 2.3, 数据库: products + reviews + faqs</p>
    </div>
  );
}`
  },
  {
    path: 'src/components/Header.tsx',
    content: `export default function Header() {
  return (
    <header className="border-b p-4">
      <nav>导航栏 (功能 1.1)</nav>
    </header>
  );
}`
  },
  {
    path: 'src/lib/prisma.ts',
    content: `import { PrismaClient } from '@prisma/client';

// Prisma 客户端单例模式（防止开发环境热更新导致连接数耗尽）
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;`
  },
  {
    path: 'src/services/product.ts',
    content: `// 商品服务 (功能 2.1, 2.2, 2.3)
import { prisma } from '@/lib/prisma';

export async function getProducts() {
  // TODO: 实现查询 products 表逻辑
  return [];
}`
  },
  {
    path: 'src/services/order.ts',
    content: `// 订单服务
import { prisma } from '@/lib/prisma';

export async function createOrder(data: any) {
  // TODO: 实现写入 orders / order_items 表逻辑
  return null;
}`
  }
];

// 执行创建逻辑
console.log('🚀 开始创建文件结构...');

filesToCreate.forEach(file => {
  const fullPath = path.join(process.cwd(), file.path);
  const dirName = path.dirname(fullPath);

  // 1. 如果文件夹不存在，递归创建文件夹
  if (!fs.existsSync(dirName)) {
    fs.mkdirSync(dirName, { recursive: true });
    console.log(`📁 创建目录: ${dirName}`);
  }

  // 2. 写入文件（如果文件已存在，会覆盖，确保内容是最新的）
  fs.writeFileSync(fullPath, file.content);
  console.log(`✅ 创建文件: ${file.path}`);
});

console.log('🎉 所有文件创建完毕！请安装 Prisma 依赖以消除代码报错。');