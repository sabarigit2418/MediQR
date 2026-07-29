process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.jnsuxuhyhrkntnifovkl:Velan%402005000@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('🔄 Starting user_name migration on Supabase...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add user_name column to sub-tables for easy identification
    const tables = ['conditions', 'allergies', 'medications', 'contacts', 'documents'];
    for (const table of tables) {
      console.log(`Adding user_name column to '${table}' table if missing...`);
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_name VARCHAR(255) DEFAULT '';`);
    }

    await client.query('COMMIT');
    console.log('✅ Migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
