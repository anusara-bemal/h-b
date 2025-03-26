import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    // Return session info
    const response = {
      authenticated: !!session,
      session: session ? {
        user: {
          ...session.user,
          // Remove sensitive data
          password: undefined
        },
        expires: session.expires
      } : null,
      databaseConnected: false,
      databaseInfo: null,
      error: null
    };
    
    // Test database connection
    try {
      if (db) {
        const [rows] = await db.query('SELECT NOW() as time');
        response.databaseConnected = true;
        response.databaseInfo = {
          time: rows[0].time,
          tables: null
        };
        
        // Check tables
        try {
          const [tables] = await db.query(`
            SELECT 
              TABLE_NAME,
              (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
               WHERE TABLE_SCHEMA = DATABASE() AND 
                     TABLE_NAME = t.TABLE_NAME) as column_count
            FROM INFORMATION_SCHEMA.TABLES t
            WHERE TABLE_SCHEMA = DATABASE()
          `);
          
          response.databaseInfo.tables = tables;
          
          // Check users table specifically
          if (session?.user?.id) {
            const [userInfo] = await db.query(
              'SELECT id, name, email, role FROM users WHERE id = ?',
              [session.user.id]
            );
            
            response.databaseInfo.userRecord = userInfo.length > 0 ? userInfo[0] : null;
          }
        } catch (tablesError) {
          response.databaseInfo.tablesError = String(tablesError);
        }
      }
    } catch (dbError) {
      response.error = String(dbError);
    }
    
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({
      error: "Debug error: " + (error instanceof Error ? error.message : String(error)),
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
} 