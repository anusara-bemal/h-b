import { NextResponse } from "next/server";
import db from "@/lib/mysql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/utils";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if the column already exists
    const columnsResult = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'categories' 
      AND COLUMN_NAME = 'image'
    `);
    
    const columns = columnsResult as any[];
    
    if (columns.length === 0) {
      // Column doesn't exist, so add it
      await db.query(`
        ALTER TABLE categories 
        ADD COLUMN image VARCHAR(255)
      `);
      return NextResponse.json({ 
        success: true, 
        message: "Image column added to categories table" 
      });
    } else {
      return NextResponse.json({ 
        success: true, 
        message: "Image column already exists in categories table" 
      });
    }
  } catch (error) {
    console.error("Error fixing categories table:", error);
    return NextResponse.json({ 
      error: "Failed to fix categories table", 
      message: (error as Error).message 
    }, { status: 500 });
  }
} 