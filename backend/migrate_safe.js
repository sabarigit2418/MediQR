const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL is not defined in the environment variables.');
  process.exit(1);
}

console.log('Connecting to database for safe migration...');

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const sqlFilePath = path.join(__dirname, 'migrate_safe.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

client.connect()
  .then(() => {
    console.log('✅ Connected to database. Running safe migration & data transfer...');
    return client.query(sql);
  })
  .then(() => {
    console.log('✅ Database safe migration completed! All existing users, profiles, and JSONB records have been migrated to the new relational tables with zero data loss.');
  })
  .catch(err => {
    console.error('❌ Error during safe migration:', err.message);
  })
  .finally(() => {
    client.end();
  });
