import mysql from 'mysql2/promise';

// Create a connection pool
const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'herba_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper functions
export async function execute(sql: string, params: any[] = []) {
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    
    // Execute the query
    const [results] = await connection.execute(sql, params);
    return [results];
  } catch (error) {
    console.error('Database error in query execution:', error);
    throw error;
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
}

// Add a query method to match what's being used in API routes
export async function query(sql: string, params: any[] = []) {
  return execute(sql, params);
}

const db = {
  execute,
  query
};

export default db; 