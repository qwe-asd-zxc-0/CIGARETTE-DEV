
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ 
    connectionString,
    ssl: { rejectUnauthorized: false }
});
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Checking Brand Data ---');
  console.log('--- Checking Brand Data ---');
  const brands = await prisma.brand.findMany({ take: 5 });
  console.log(JSON.stringify(brands, null, 2));

  console.log('\n--- Checking Product Data (Top 5) ---');
  const products = await prisma.product.findMany({ 
      take: 5,
      select: {
          id: true,
          title: true,
          category: true,
          brandId: true
      }
  });
  console.log(JSON.stringify(products, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
