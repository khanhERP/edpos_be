
import { db } from './db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  try {
    console.log('📊 Starting product price precision migration...');
    
    const sqlPath = path.join(__dirname, 'increase_product_price_precision.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('🔄 Executing migration SQL...');
    await db.execute(sql);
    
    console.log('✅ Product price precision migration completed successfully!');
    console.log('📈 Products table now supports prices up to 999,999,999,999,999.99');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
