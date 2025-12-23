
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking products...");
    const count = await prisma.product.count();
    console.log(`Total products: ${count}`);

    const products = await prisma.product.findMany({
      take: 5,
    });

    console.log("First 5 products:");
    products.forEach(p => {
      console.log(`ID: ${p.id}`);
      console.log(`Title:`, p.title, `(Type: ${typeof p.title})`);
      console.log(`Status:`, p.status);
      console.log(`Category:`, p.category);
      console.log("-------------------");
    });

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
