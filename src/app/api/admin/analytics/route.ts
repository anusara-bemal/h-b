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

    try {
      // Get total users
      const usersResult = await db.query("SELECT COUNT(*) as count FROM users");
      const totalUsers = usersResult[0]?.count || 0;

      // Get total products
      const productsResult = await db.query("SELECT COUNT(*) as count FROM products");
      const totalProducts = productsResult[0]?.count || 0;

      // Get total orders and revenue
      const ordersResult = await db.query(
        "SELECT COUNT(*) as orderCount, COALESCE(SUM(total), 0) as totalRevenue FROM orders"
      );
      const totalOrders = ordersResult[0]?.orderCount || 0;
      const totalRevenue = ordersResult[0]?.totalRevenue || 0;

      // Get sales data for the past 30 days (with fallback for empty results)
      let salesData = [];
      try {
        salesData = await db.query(`
          SELECT 
            DATE(createdAt) as date,
            SUM(total) as revenue,
            COUNT(*) as orderCount
          FROM orders
          WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
          GROUP BY DATE(createdAt)
          ORDER BY date
        `);
      } catch (error) {
        console.error("Error fetching sales data:", error);
        // Return empty array if query fails
      }

      // Get top selling products (with fallback)
      let topProducts = [];
      try {
        // Check if order_items table exists and has necessary relationships
        const orderItemsTableCheck = await db.query(`
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'herba_db' AND table_name = 'order_items' LIMIT 1
        `);
        
        if (orderItemsTableCheck.length > 0) {
          topProducts = await db.query(`
            SELECT 
              p.id,
              p.name,
              p.price,
              SUM(oi.quantity) as totalSold,
              SUM(oi.price * oi.quantity) as totalRevenue
            FROM products p
            JOIN order_items oi ON p.id = oi.productId
            JOIN orders o ON oi.orderId = o.id
            GROUP BY p.id, p.name, p.price
            ORDER BY totalSold DESC
            LIMIT 5
          `);
        } else {
          // Fallback if order_items table is not available
          topProducts = await db.query(`
            SELECT id, name, price, 0 as totalSold, 0 as totalRevenue
            FROM products
            ORDER BY createdAt DESC
            LIMIT 5
          `);
        }
      } catch (error) {
        console.error("Error fetching top products:", error);
        // Return empty array if query fails
      }

      // Get revenue by category (with fallback)
      let categoryRevenue = [];
      try {
        // Check if necessary tables exist
        const categoryTableCheck = await db.query(`
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'herba_db' AND table_name = 'categories' LIMIT 1
        `);
        
        if (categoryTableCheck.length > 0) {
          categoryRevenue = await db.query(`
            SELECT 
              c.id,
              c.name,
              COALESCE(SUM(oi.price * oi.quantity), 0) as revenue
            FROM categories c
            LEFT JOIN products p ON c.id = p.categoryId
            LEFT JOIN order_items oi ON p.id = oi.productId
            GROUP BY c.id, c.name
            ORDER BY revenue DESC
          `);
        } else {
          // Fallback to dummy data
          categoryRevenue = [];
        }
      } catch (error) {
        console.error("Error fetching category revenue:", error);
        // Return empty array if query fails
      }

      // Get recent orders (with fallback)
      let recentOrders = [];
      try {
        recentOrders = await db.query(`
          SELECT 
            o.id,
            o.total,
            o.status,
            o.createdAt,
            COALESCE(u.name, 'Guest') as customerName
          FROM orders o
          LEFT JOIN users u ON o.userId = u.id
          ORDER BY o.createdAt DESC
          LIMIT 5
        `);
      } catch (error) {
        console.error("Error fetching recent orders:", error);
        // Return empty array if query fails
      }

      return NextResponse.json({
        salesData,
        topProducts,
        categoryRevenue,
        recentOrders,
        totals: {
          revenue: totalRevenue,
          orders: totalOrders,
          users: totalUsers,
          products: totalProducts
        }
      });
    } catch (error) {
      console.error("Error in database operations:", error);
      return NextResponse.json({ 
        error: "Database error", 
        message: (error as Error).message 
      }, { status: 500 });
    }
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 });
  }
} 