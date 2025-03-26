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

// Helper function to execute queries
export async function query(sql: string, params: any[] = []) {
  let connection;
  try {
    // Get a connection from the pool
    connection = await pool.getConnection();
    console.log("Database connection established");
    
    // Execute the query
    console.log("Executing SQL:", sql);
    if (params.length > 0) {
      console.log("Parameters:", params);
    }
    
    // MySQL2 returns [rows, fields] array
    const [results] = await connection.execute(sql, params);
    console.log(`Query returned ${Array.isArray(results) ? results.length : 1} results`);
    return results; // Return only the rows
  } catch (error) {
    console.error('Database error in query execution:', error);
    throw error;
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
      console.log("Database connection released");
    }
  }
}

// Helper functions for common operations
export async function findMany(table: string, where: Record<string, any> = {}, options: any = {}) {
  const conditions = [];
  const values = [];
  
  // Build WHERE conditions
  for (const [key, value] of Object.entries(where)) {
    conditions.push(`${key} = ?`);
    values.push(value);
  }
  
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderClause = options.orderBy ? `ORDER BY ${options.orderBy.field} ${options.orderBy.direction || 'ASC'}` : '';
  const limitClause = options.limit ? `LIMIT ${options.limit}` : '';
  
  const sql = `SELECT * FROM ${table} ${whereClause} ${orderClause} ${limitClause}`;
  return query(sql, values);
}

export async function findById(table: string, id: string) {
  const results = await query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
  return results[0] || null;
}

export async function create(table: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map(() => '?').join(', ');
  
  const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
  const result = await query(sql, values);
  
  if (result.insertId) {
    return { ...data, id: result.insertId };
  }
  
  return data;
}

export async function update(table: string, id: string, data: Record<string, any>) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  
  const setClause = keys.map(key => `${key} = ?`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
  
  await query(sql, [...values, id]);
  return { id, ...data };
}

export async function remove(table: string, id: string) {
  const sql = `DELETE FROM ${table} WHERE id = ?`;
  await query(sql, [id]);
  return { id };
}

// Specialized functions for specific relationships

// Get categories with product count
export async function getCategoriesWithProductCount() {
  const sql = `
    SELECT c.*, 
           COUNT(p.id) as productCount
    FROM categories c
    LEFT JOIN products p ON c.id = p.categoryId
    GROUP BY c.id
    ORDER BY c.name ASC
  `;
  
  return query(sql);
}

// Helper to ensure IDs are consistent
function normalizeId(id: any): number {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

// Get products with category info
export async function getProductsWithCategory(filters: Record<string, any> = {}) {
  try {
    const conditions = [];
    const values = [];
    
    // Build WHERE conditions
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'query') {
        conditions.push(`(p.name LIKE ? OR p.description LIKE ?)`);
        values.push(`%${value}%`, `%${value}%`);
      } else if (key === 'categoryId') {
        conditions.push(`p.categoryId = ?`);
        values.push(normalizeId(value));
      } else if (key === 'isPublished' || key === 'isFeatured') {
        conditions.push(`p.${key} = ?`);
        values.push(value ? 1 : 0);
      }
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Use LEFT JOIN instead of JOIN to include products even if category might be missing
    const sql = `
      SELECT p.*, 
             c.id as categoryId, 
             c.name as categoryName, 
             c.slug as categorySlug
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      ${whereClause}
      ORDER BY p.createdAt DESC
    `;
    
    console.log("SQL Query:", sql);
    console.log("SQL Values:", values);
    
    const products = await query(sql, values);
    
    // Format the result to match the Prisma format
    return products.map((product: any) => ({
      ...product,
      // Ensure ID is consistent and numeric
      id: normalizeId(product.id),
      category: product.categoryId ? {
        id: normalizeId(product.categoryId),
        name: product.categoryName || 'Unknown',
        slug: product.categorySlug || 'unknown'
      } : null
    }));
  } catch (error) {
    console.error("Error in getProductsWithCategory:", error);
    throw error; // Re-throw the error to be caught by the API route
  }
}

export default {
  query,
  findMany,
  findById,
  create,
  update,
  remove,
  getCategoriesWithProductCount,
  getProductsWithCategory
}; 