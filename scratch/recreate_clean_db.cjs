process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../backend/.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.jnsuxuhyhrkntnifovkl:Velan%402005000@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require';

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function resetDatabase() {
  console.log('🔄 Wiping all tables and recreating a clean database on Supabase...');
  
  // Read the SQL schema file
  const sqlPath = path.join(__dirname, '..', 'backend', 'database.sql');
  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  const client = await pool.connect();
  try {
    // Run the SQL script
    await client.query(sqlContent);
    console.log('✅ Database dropped and recreated successfully!');
  } catch (err) {
    console.error('❌ Failed to reset database:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
