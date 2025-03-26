import mysql from 'mysql2/promise';

// Define the QueryResult type
import { OkPacket, ResultSetHeader, RowDataPacket } from 'mysql2';

export type QueryResult = OkPacket | ResultSetHeader | RowDataPacket[] | RowDataPacket[][];

// Create a database connection pool
export const pool = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'herbal_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Execute a query and return the results
export async function executeQuery<T>({ query, values = [] }: { query: string; values?: any[] }): Promise<T> {
  try {
    const [results] = await pool.execute(query, values);
    return results as T;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get a single record by ID
export async function getById<T>({ table, id }: { table: string; id: string }): Promise<T | null> {
  try {
    const query = `SELECT * FROM ${table} WHERE id = ?`;
    const results = await executeQuery<T[]>({ query, values: [id] });
    
    return results && results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error(`Error fetching ${table} by ID:`, error);
    throw error;
  }
}

// Insert a new record
export async function insert<T>({ table, data }: { table: string; data: Record<string, any> }): Promise<T> {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    const result = await executeQuery<mysql.ResultSetHeader>({ query, values });
    
    // Get the inserted record
    if (result.insertId) {
      const insertedRecord = await getById<T>({ table, id: result.insertId.toString() });
      return insertedRecord as T;
    }
    
    throw new Error('Failed to insert record');
  } catch (error) {
    console.error(`Error inserting into ${table}:`, error);
    throw error;
  }
}

// Update a record
export async function update<T>({ 
  table, 
  id, 
  data 
}: { 
  table: string; 
  id: string; 
  data: Record<string, any> 
}): Promise<T | null> {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
    
    await executeQuery<mysql.ResultSetHeader>({ 
      query, 
      values: [...values, id] 
    });
    
    // Get the updated record
    return await getById<T>({ table, id });
  } catch (error) {
    console.error(`Error updating ${table}:`, error);
    throw error;
  }
}

// Delete a record
export async function remove({ 
  table, 
  id 
}: { 
  table: string; 
  id: string 
}): Promise<boolean> {
  try {
    const query = `DELETE FROM ${table} WHERE id = ?`;
    const result = await executeQuery<mysql.ResultSetHeader>({ query, values: [id] });
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error(`Error deleting from ${table}:`, error);
    throw error;
  }
}

// Get paginated results
export async function getPaginated<T>({ 
  table,
  page = 1,
  limit = 10,
  orderBy = 'id',
  orderDir = 'DESC',
  where = '',
  whereParams = [],
}: { 
  table: string;
  page?: number;
  limit?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
  where?: string;
  whereParams?: any[];
}): Promise<{ data: T[]; total: number; pages: number; }> {
  try {
    const offset = (page - 1) * limit;
    const whereClause = where ? `WHERE ${where}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM ${table} ${whereClause}`;
    const countResult = await executeQuery<Array<{total: number}>>({ 
      query: countQuery, 
      values: whereParams 
    });
    
    const total = countResult[0].total;
    const pages = Math.ceil(total / limit);
    
    // Get paginated data
    const dataQuery = `
      SELECT * FROM ${table} 
      ${whereClause} 
      ORDER BY ${orderBy} ${orderDir} 
      LIMIT ? OFFSET ?
    `;
    
    const data = await executeQuery<T[]>({ 
      query: dataQuery, 
      values: [...whereParams, limit, offset] 
    });
    
    return { data, total, pages };
  } catch (error) {
    console.error(`Error fetching paginated data from ${table}:`, error);
    throw error;
  }
} 