// Quick script to add image column to categories table
const mysql = require('mysql2/promise');
require('dotenv').config();

async function updateCategoriesTable() {
  // Create connection
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'herba_db'
  });

  try {
    console.log('Adding image column to categories table...');
    
    // Check if the column already exists
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'categories' 
      AND COLUMN_NAME = 'image'
    `, [process.env.DB_NAME || 'herba_db']);
    
    if (columns.length === 0) {
      // Column doesn't exist, so add it
      await connection.query(`
        ALTER TABLE categories 
        ADD COLUMN image VARCHAR(255)
      `);
      console.log('Successfully added image column to categories table');
    } else {
      console.log('Image column already exists in categories table');
    }
  } catch (error) {
    console.error('Error updating categories table:', error);
  } finally {
    await connection.end();
    process.exit(0);
  }
}

updateCategoriesTable(); 