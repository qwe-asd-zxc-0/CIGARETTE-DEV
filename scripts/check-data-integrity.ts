
require('dotenv').config();
import { prisma } from '../src/lib/prisma';

async function main() {
  const products = await prisma.product.findMany();
  console.log(`Checking ${products.length} products...`);

  for (const p of products) {
    const title = p.title as any;
    if (title && typeof title === 'object') {
      for (const key in title) {
        if (typeof title[key] !== 'string') {
          console.error(`❌ Product ${p.id} has invalid title[${key}]:`, title[key]);
        }
      }
    }

    const flavor = p.flavor as any;
    if (flavor && typeof flavor === 'object') {
      for (const key in flavor) {
        if (typeof flavor[key] !== 'string') {
          console.error(`❌ Product ${p.id} has invalid flavor[${key}]:`, flavor[key]);
        }
      }
    }
    
    // Check brand name if loaded (need to fetch brand)
  }
  
  const brands = await prisma.brand.findMany();
  for (const b of brands) {
      const name = b.name as any;
      if (name && typeof name === 'object') {
          for (const key in name) {
              if (typeof name[key] !== 'string') {
                  console.error(`❌ Brand ${b.id} has invalid name[${key}]:`, name[key]);
              }
          }
      }
  }

  console.log("Done checking.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
