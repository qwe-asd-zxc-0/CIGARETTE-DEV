
import * as dotenv from 'dotenv';
dotenv.config();
import { prisma } from '../src/lib/prisma';

async function checkBrands() {
  try {
    const brands = await prisma.brand.findMany({
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    console.log(`Total brands: ${brands.length}`);
    
    const nameMap: Record<string, number[]> = {};
    brands.forEach(b => {
      // Normalize name for comparison (assuming name is JSON, we might need to check specific locales or stringify)
      const nameStr = JSON.stringify(b.name);
      if (!nameMap[nameStr]) {
        nameMap[nameStr] = [];
      }
      nameMap[nameStr].push(b.id);
    });

    console.log('Duplicate names:');
    let duplicateCount = 0;
    for (const [name, ids] of Object.entries(nameMap)) {
      if (ids.length > 1) {
        console.log(`Name: ${name}, IDs: ${ids.join(', ')}`);
        duplicateCount++;
      }
    }
    
    if (duplicateCount === 0) {
        console.log("No duplicates found based on exact JSON string match.");
    }

  } catch (e) {
    console.error(e);
  } finally {
    // await prisma.$disconnect(); // prisma instance from lib might be managed globally
  }
}

checkBrands();
