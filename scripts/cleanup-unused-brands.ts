
import * as dotenv from 'dotenv';
// Ensure environment variables are loaded BEFORE importing prisma client
dotenv.config();

import { prisma } from '../src/lib/prisma';

async function cleanupUnusedBrands() {
  console.log('Starting cleanup of unused brands...');
  
  try {
    // 1. Count total brands
    const totalBrands = await prisma.brand.count();
    console.log(`Total brands in database: ${totalBrands}`);

    // 2. Find brands that have NO products associated with them
    const unusedBrands = await prisma.brand.findMany({
      where: {
        products: {
          none: {}
        }
      },
      select: {
        id: true,
        name: true
      }
    });

    console.log(`Found ${unusedBrands.length} brands with no products.`);

    if (unusedBrands.length > 0) {
      console.log('Sample of unused brands:', unusedBrands.slice(0, 5).map(b => b.name));
      
      // 3. Delete them
      console.log('Deleting...');
      const result = await prisma.brand.deleteMany({
        where: {
          id: {
            in: unusedBrands.map(b => b.id)
          }
        }
      });
      
      console.log(`✅ Successfully deleted ${result.count} unused brands.`);
    } else {
      console.log('No unused brands found. All brands are currently assigned to at least one product.');
    }

    // 4. Check for duplicates (Same name, multiple IDs) to inform the user
    console.log('\nChecking for duplicate brand names (potential fragmentation)...');
    const brands = await prisma.brand.findMany({
        select: { name: true, id: true }
    });
    
    const nameMap = new Map<string, number>();
    let duplicateCount = 0;
    
    for (const b of brands) {
        // Handle JSON or String name
        let nameStr = '';
        try {
            if (typeof b.name === 'object' && b.name !== null) {
                // @ts-ignore
                nameStr = b.name['en'] || JSON.stringify(b.name);
            } else {
                nameStr = String(b.name);
            }
        } catch { nameStr = String(b.name); }
        
        nameStr = nameStr.trim();
        
        if (nameMap.has(nameStr)) {
            duplicateCount++;
        } else {
            nameMap.set(nameStr, 1);
        }
    }
    
    if (duplicateCount > 0) {
        console.log(`⚠️ Warning: Found ${duplicateCount} brands that share a name with another brand.`);
        console.log('This confirms that multiple brand records exist for the same actual brand name.');
        console.log('Deleting unused brands alone will NOT fix this if all duplicates are attached to products.');
    } else {
        console.log('No duplicate brand names found.');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Close connection if needed, though pool might keep it open
    // await prisma.$disconnect(); 
  }
}

cleanupUnusedBrands();
