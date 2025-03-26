const mysql = require('mysql2/promise');

async function fixDatabase() {
  let connection;
  try {
    // Connect to the database
    connection = await mysql.createConnection({
      host: process.env.DATABASE_HOST || 'localhost',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'herba_db'
    });
    
    console.log('Connected to database');
    
    // Check table structure
    const [tables] = await connection.query('SHOW TABLES LIKE "carts"');
    if (tables.length === 0) {
      console.log('Carts table does not exist, skipping fix');
      return;
    }
    
    // Get current table information
    const [columns] = await connection.query('DESCRIBE carts');
    console.log('Current carts table structure:', columns.map(col => `${col.Field} (${col.Type}, ${col.Key})`).join(', '));
    
    // Fix 1: Try to modify the primary key constraint and make ID a UUID
    try {
      console.log('Attempting to fix empty primary key issue...');
      
      // Generate UUIDs for any rows with empty primary keys
      await connection.query(`
        UPDATE carts 
        SET id = UUID() 
        WHERE id IS NULL OR id = ''
      `);
      console.log('Updated any rows with empty IDs');
      
      // Check if there are still any duplicate or empty IDs
      const [duplicates] = await connection.query(`
        SELECT id, COUNT(*) as count 
        FROM carts 
        GROUP BY id 
        HAVING COUNT(*) > 1 OR id IS NULL OR id = ''
      `);
      
      if (duplicates.length > 0) {
        console.log('Found duplicate or empty IDs:', duplicates);
        
        // Handle any remaining duplicates by generating new UUIDs
        for (const dup of duplicates) {
          const [rows] = await connection.query(`
            SELECT * FROM carts WHERE id = ?
          `, [dup.id]);
          
          // Keep the first one, update the rest
          for (let i = 1; i < rows.length; i++) {
            await connection.query(`
              UPDATE carts 
              SET id = UUID() 
              WHERE id = ? 
              LIMIT 1
            `, [dup.id]);
            console.log(`Updated duplicate ID: ${dup.id}`);
          }
        }
      } else {
        console.log('No duplicate or empty IDs found');
      }
      
      console.log('Cart table primary key issue fixed');
    } catch (error) {
      console.error('Error fixing primary key:', error);
    }
    
  } catch (error) {
    console.error('Database fix failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

// Run the fix
fixDatabase().then(() => {
  console.log('Fix completed');
}).catch(err => {
  console.error('Fix script error:', err);
}); 