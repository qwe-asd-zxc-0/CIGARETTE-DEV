import 'dotenv/config';
import { prisma } from '../src/lib/prisma';

async function fixTableField(tableName: string, fieldName: string) {
  console.log(`Checking ${tableName}.${fieldName}...`);
  try {
    // We use executeRawUnsafe to perform a safe update.
    // We assume the column is TEXT. If it is JSONB, this query might fail or need adjustment, 
    // but if it is JSONB, the data should already be valid JSON.
    // The user's error suggests it contains raw strings, so it's likely TEXT.
    
    // We wrap the existing string in {"en": "..."}
    // We use PostgreSQL's jsonb_build_object to handle escaping correctly, then cast back to text.
    
    const count = await prisma.$executeRawUnsafe(`
      UPDATE "${tableName}"
      SET "${fieldName}" = jsonb_build_object('en', "${fieldName}")::text
      WHERE "${fieldName}" IS NOT NULL 
      AND "${fieldName}" NOT LIKE '{%' 
      AND "${fieldName}" != ''
    `);
    
    console.log(`Updated ${count} rows in ${tableName}.${fieldName}`);
  } catch (e: any) {
    console.error(`Error updating ${tableName}.${fieldName}:`, e.message);
  }
}

async function main() {
  console.log('Starting JSON field fix...');

  // Product
  await fixTableField('products', 'title');
  await fixTableField('products', 'description');
  await fixTableField('products', 'flavor');
  await fixTableField('products', 'category');

  // Brand
  await fixTableField('brands', 'name');
  await fixTableField('brands', 'description');

  // OrderItem
  await fixTableField('order_items', 'product_title_snapshot');
  await fixTableField('order_items', 'flavor_snapshot');

  console.log('Finished.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
