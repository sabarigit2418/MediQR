process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
require('dotenv').config({ path: '../backend/.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.jnsuxuhyhrkntnifovkl:Velan%402005000@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'activity_logs' 
      ORDER BY ordinal_position;
    `);
    console.log('📋 Columns of activity_logs table:');
    console.log(res.rows);
  } catch (err) {
    console.error('❌ Failed to check schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSchema();
