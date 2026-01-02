
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({ 
  connectionString,
  ssl: { 
    rejectUnauthorized: false 
  },
  max: 10,
  idleTimeoutMillis: 30000
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function checkCategories() {
  try {
    const products = await prisma.product.findMany({
      select: {
        category: true
      },
      distinct: ['category']
    });

    console.log('Distinct Categories:');
    products.forEach(p => {
      console.log(`Category: ${JSON.stringify(p.category)}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
