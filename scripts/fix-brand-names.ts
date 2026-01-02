
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
  console.log('Starting Brand name fix...');
  const brands = await prisma.brand.findMany();
  
  for (const brand of brands) {
    const name: any = brand.name;
    
    // Check if it's the double nested structure
    // Pattern: { en: { en: "...", zh: "..." } }
    if (name && typeof name === 'object' && name.en && typeof name.en === 'object') {
        console.log(`Fixing brand ${brand.id}:`, JSON.stringify(name));
        
        const inner = name.en;
        const newName = {
            en: inner.en || inner.zh || "Unknown",
            zh: inner.zh || inner.en || "Unknown"
        };
        
        await prisma.brand.update({
            where: { id: brand.id },
            data: { name: newName }
        });
        console.log(`  -> Fixed to:`, JSON.stringify(newName));
    } 
    // Check if it is just { en: "..." } but missing zh or vice versa, or just correct.
    // If it is correct { en: string, zh: string }, do nothing.
  }
  
  console.log('Brand name fix complete.');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
