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

console.log('Connecting to database...');

const client = new Client({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

const sqlFilePath = path.join(__dirname, 'database.sql');
const sql = fs.readFileSync(sqlFilePath, 'utf8');

client.connect()
  .then(() => {
    console.log('✅ Connected to database. Executing schema update...');
    return client.query(sql);
  })
  .then(() => {
    console.log('✅ Database schema updated and tables recreated successfully!');
  })
  .catch(err => {
    console.error('❌ Error recreating database:', err.message);
  })
  .finally(() => {
    client.end();
  });
