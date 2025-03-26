import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { hasAdminAccess } from "@/lib/utils";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Mock data for testing
const mockOrders = [
  {
    id: "ORD-1001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    total: 78.95,
    status: "delivered",
    createdAt: "2023-05-15T10:30:00Z",
    updatedAt: "2023-05-16T14:20:00Z",
    items: [
      { id: "item1", productId: "p1", name: "Organic Green Tea", price: 12.99, quantity: 2, total: 25.98 },
      { id: "item2", productId: "p2", name: "Lavender Essential Oil", price: 18.99, quantity: 1, total: 18.99 }
    ]
  },
  {
    id: "ORD-1002",
    customerName: "Jane Smith",
    customerEmail: "jane@example.com",
    total: 129.99,
    status: "shipped",
    createdAt: "2023-05-14T14:45:00Z",
    updatedAt: "2023-05-15T09:30:00Z",
    items: [
      { id: "item3", productId: "p3", name: "Echinacea Supplement", price: 15.99, quantity: 3, total: 47.97 },
      { id: "item4", productId: "p4", name: "Chamomile Tea", price: 10.99, quantity: 2, total: 21.98 },
      { id: "item5", productId: "p5", name: "Tea Tree Essential Oil", price: 14.99, quantity: 1, total: 14.99 }
    ]
  },
  {
    id: "ORD-1003",
    customerName: "Michael Johnson",
    customerEmail: "michael@example.com",
    total: 54.50,
    status: "processing",
    createdAt: "2023-05-14T09:15:00Z",
    updatedAt: "2023-05-14T09:15:00Z",
    items: [
      { id: "item6", productId: "p6", name: "Aloe Vera Gel", price: 9.99, quantity: 1, total: 9.99 },
      { id: "item7", productId: "p7", name: "Turmeric Capsules", price: 19.99, quantity: 2, total: 39.98 }
    ]
  },
  {
    id: "ORD-1004",
    customerName: "Emily Davis",
    customerEmail: "emily@example.com",
    total: 219.45,
    status: "delivered",
    createdAt: "2023-05-13T16:20:00Z",
    updatedAt: "2023-05-14T18:45:00Z",
    items: [
      { id: "item8", productId: "p8", name: "Complete Herbal Kit", price: 199.99, quantity: 1, total: 199.99 },
      { id: "item9", productId: "p9", name: "Herbal Tea Sampler", price: 19.99, quantity: 1, total: 19.99 }
    ]
  },
  {
    id: "ORD-1005",
    customerName: "Robert Wilson",
    customerEmail: "robert@example.com",
    total: 35.99,
    status: "cancelled",
    createdAt: "2023-05-12T11:50:00Z",
    updatedAt: "2023-05-12T14:30:00Z",
    items: [
      { id: "item10", productId: "p10", name: "Peppermint Tea", price: 11.99, quantity: 3, total: 35.97 }
    ]
  }
];

export async function GET(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build the base query for orders
    let query = `
      SELECT DISTINCT
        o.id,
        o.status,
        o.total,
        o.createdAt,
        o.updatedAt,
        u.name as customerName,
        u.email as customerEmail
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
    `;

    const params: any[] = [];
    const conditions: string[] = [];

    // Add WHERE clauses
    if (status && status !== "all") {
      conditions.push("o.status = ?");
      params.push(status);
    }

    if (search) {
      conditions.push("(o.id LIKE ? OR u.name LIKE ? OR u.email LIKE ?)");
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // Add ORDER BY
    const validColumns = ["id", "status", "total", "createdAt", "updatedAt", "customerName"];
    const validSortBy = validColumns.includes(sortBy) ? 
      (sortBy === "customerName" ? "u.name" : `o.${sortBy}`) : 
      "o.createdAt";
    query += ` ORDER BY ${validSortBy} ${sortOrder.toUpperCase()}`;

    // Add LIMIT and OFFSET
    const offset = (page - 1) * limit;
    query += ` LIMIT ${parseInt(String(limit))} OFFSET ${parseInt(String(offset))}`;

    // Execute main query
    const [orders] = await pool.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT o.id) as total
      FROM orders o
      LEFT JOIN users u ON o.userId = u.id
    `;
    if (conditions.length > 0) {
      countQuery += " WHERE " + conditions.join(" AND ");
    }
    const [countRows] = await pool.execute(countQuery, params);
    const total = countRows[0].total;

    // Fetch items for each order
    const ordersWithItems = await Promise.all(orders.map(async (order: any) => {
      const [items] = await pool.execute(`
        SELECT 
          oi.id,
          oi.productId,
          p.name as productName,
          oi.quantity,
          oi.price
        FROM order_items oi
        LEFT JOIN products p ON oi.productId = p.id
        WHERE oi.orderId = ?
      `, [order.id]);

      return {
        ...order,
        items: items || []
      };
    }));

    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id, status } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!status || !["pending", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Update order status in database
    await pool.execute(
      "UPDATE orders SET status = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?",
      [status, id]
    );

    return NextResponse.json({ 
      message: "Order status updated successfully" 
    });

  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
} 