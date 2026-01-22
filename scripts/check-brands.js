
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
    
    const nameMap = {};
    brands.forEach(b => {
      const nameStr = JSON.stringify(b.name);
      if (!nameMap[nameStr]) {
        nameMap[nameStr] = [];
      }
      nameMap[nameStr].push(b.id);
    });

    console.log('Duplicate names:');
    for (const [name, ids] of Object.entries(nameMap)) {
      if (ids.length > 1) {
        console.log(`Name: ${name}, IDs: ${ids.join(', ')}`);
      }
    }

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkBrands();
