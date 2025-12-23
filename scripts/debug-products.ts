
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env file from project root
config({ path: resolve(__dirname, '../.env') });

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Checking products...');
  const count = await prisma.product.count();
  console.log(`Total products: ${count}`);

  const activeCount = await prisma.product.count({
    where: { status: 'active' }
  });
  console.log(`Active products: ${activeCount}`);

  const products = await prisma.product.findMany({
    take: 3,
  });
  
  console.log('Sample products:', JSON.stringify(products, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
