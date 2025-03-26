// Simple script to dump the products table schema
require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  // Create a connection pool
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'herba_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  try {
    // Get the table schema
    const [rows] = await pool.execute('SHOW COLUMNS FROM products');
    console.log('Products Table Schema:');
    console.log('-----------------------');
    
    rows.forEach(column => {
      console.log(`${column.Field} (${column.Type}) ${column.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${column.Key ? `[${column.Key}]` : ''}`);
    });

    // Get sample product data
    const [products] = await pool.execute('SELECT * FROM products LIMIT 1');
    console.log('\nSample Product Data:');
    console.log('-------------------');
    console.log(JSON.stringify(products[0], null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

main(); 