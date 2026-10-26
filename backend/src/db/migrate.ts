import fs from 'fs';
import path from 'path';
import { pool } from './index';

export async function runMigration() {
  console.log('Running database migration...');
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  try {
    await pool.query(schemaSql);
    console.log('✅ Database schema created successfully.');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigration()
    .then(() => pool.end())
    .catch(() => process.exit(1));
}
