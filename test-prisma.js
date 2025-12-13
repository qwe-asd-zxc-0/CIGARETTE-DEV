
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Checking Product model fields...");
    // We can't easily inspect types at runtime, but we can try a dummy update (that will fail validation but show us if arguments are accepted)
    // Or just print the dmmf if we could access it.
    
    // Let's try to see if we can access prisma.product.fields or similar (not available in recent prisma versions directly on client instance)
    
    console.log("Prisma Client Version:", require('@prisma/client/package.json').version);
    
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
