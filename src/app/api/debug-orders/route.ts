import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { hasAdminAccess } from "@/lib/utils";

// Debug endpoint to help diagnose order filtering issues
export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    const userIdAsInt = parseInt(session.user.id as string, 10);
    
    // Get some sample orders to check userId types
    const [orders] = await db.query(`SELECT id, userId FROM orders LIMIT 5`);
    
    // Get count of orders for current user using string comparison
    const [stringCompare] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE userId = ?`,
      [userId]
    );
    
    // Get count of orders for current user using int comparison
    const [intCompare] = await db.query(
      `SELECT COUNT(*) as count FROM orders WHERE userId = ?`,
      [userIdAsInt]
    );
    
    // Return debug info
    return NextResponse.json({
      session: {
        userId,
        userIdType: typeof userId,
        userIdAsInt,
        role: session.user.role,
        email: session.user.email
      },
      sampleOrders: orders,
      orderCounts: {
        usingStringId: stringCompare,
        usingIntId: intCompare,
        total: await db.query(`SELECT COUNT(*) as count FROM orders`)
      }
    });
  } catch (error) {
    console.error("Error in debug-orders:", error);
    return NextResponse.json(
      { error: "Debug query failed: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 