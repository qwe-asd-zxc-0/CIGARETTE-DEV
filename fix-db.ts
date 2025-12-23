
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Attempting to fix database schema mismatch...');
  
  const tableNames = ['Product', 'products', 'product'];
  let tableName = '';

  for (const name of tableNames) {
    try {
        await prisma.$queryRawUnsafe(`SELECT count(*) FROM "${name}" LIMIT 1`);
        tableName = name;
        console.log(`Found table: "${tableName}"`);
        break;
    } catch (e) {
        // ignore
    }
  }

  if (!tableName) {
      console.error('Could not find Product table.');
      return;
  }

  try {
    // 1. Update data to be valid JSON string
    // We wrap the existing text in {"en": "..."}
    console.log('Updating data format...');
    await prisma.$executeRawUnsafe(`
      UPDATE "${tableName}"
      SET "category" = ('{"en": "' || "category" || '"}')
      WHERE "category" IS NOT NULL 
      AND "category" NOT LIKE '{%';
    `);

    // 2. Cast column to JSONB
    console.log('Altering column type...');
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "${tableName}"
      ALTER COLUMN "category" TYPE JSONB 
      USING "category"::jsonb;
    `);
    
    console.log('✅ Database fixed successfully!');
  } catch (e) {
    console.error('Error updating database:', e);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
