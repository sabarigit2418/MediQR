process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.jnsuxuhyhrkntnifovkl:Velan%402005000@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log('🔄 Running migration: adding "date" column to "medications" table...');
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE medications 
      ADD COLUMN IF NOT EXISTS date VARCHAR(100) DEFAULT '';
    `);
    console.log('✅ Migration succeeded: "date" column added successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
