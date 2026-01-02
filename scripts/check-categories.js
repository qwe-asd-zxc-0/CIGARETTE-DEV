
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        category: true
      },
      take: 10
    });

    console.log('Product Categories:');
    products.forEach(p => {
      console.log(`ID: ${p.id}, Title: ${JSON.stringify(p.title)}, Category: ${JSON.stringify(p.category)}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
