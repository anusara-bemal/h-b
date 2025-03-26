import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

// POST: Create a new order
export async function POST(request: NextRequest) {
  try {
    // Get user from session if logged in, but don't require it
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id as string, 10) : null;
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }
    
    if (!body.shippingAddress || !body.total) {
      return NextResponse.json(
        { error: "Shipping address and total are required" },
        { status: 400 }
      );
    }
    
    if (!body.customer || !body.customer.email) {
      return NextResponse.json(
        { error: "Customer information including email is required" },
        { status: 400 }
      );
    }
    
    // Create an order in the database
    const shippingAddress = body.shippingAddress;
    const billingAddress = body.billingAddress || body.shippingAddress;
    
    try {
      // Insert order into database
      const [orderResult] = await db.query(
        `INSERT INTO orders 
          (userId, total, status, paymentStatus, 
          shippingAddress, billingAddress, 
          customerFirstName, customerLastName, customerEmail, customerPhone, 
          paymentMethod, paymentDetails) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          body.total,
          'pending', // Default status
          'pending', // Default payment status
          typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
          typeof billingAddress === 'string' ? billingAddress : JSON.stringify(billingAddress),
          body.customer.firstName,
          body.customer.lastName,
          body.customer.email,
          body.customer.phone,
          body.paymentMethod,
          JSON.stringify(body.paymentDetails || null)
        ]
      );
      
      // Get the inserted order ID
      const orderId = orderResult.insertId;
      
      // Continue with order items and inventory update...
      // Insert order items
      for (const item of body.items) {
        await db.query(
          `INSERT INTO order_items 
            (orderId, productId, quantity, price, name) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id, // Use item.id as productId
            item.quantity,
            item.price,
            item.name
          ]
        );
        
        // Update product inventory if product exists in database
        if (item.id) {
          try {
            await db.query(
              `UPDATE products 
               SET inventory = inventory - ? 
               WHERE id = ? AND inventory >= ?`,
              [item.quantity, item.id, item.quantity]
            );
          } catch (error) {
            console.error(`Error updating inventory for product ${item.id}:`, error);
            // Continue processing even if inventory update fails
          }
        }
      }
      
      // Return the created order
      return NextResponse.json(
        { 
          id: orderId,
          userId,
          total: body.total,
          status: 'pending',
          paymentStatus: 'pending',
          items: body.items,
          shippingAddress,
          billingAddress,
          customer: body.customer,
          paymentMethod: body.paymentMethod,
          paymentDetails: body.paymentDetails,
          createdAt: new Date().toISOString()
        }, 
        { status: 201 }
      );
    } catch (error) {
      console.error("Error with new schema, falling back to old schema:", error);
      
      // If the first attempt fails, try with the old schema (without payment columns)
      const [orderResult] = await db.query(
        `INSERT INTO orders 
          (userId, total, status, 
          shippingAddress, billingAddress, 
          customerFirstName, customerLastName, customerEmail, customerPhone) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          body.total,
          'pending', // Default status
          typeof shippingAddress === 'string' ? shippingAddress : JSON.stringify(shippingAddress),
          typeof billingAddress === 'string' ? billingAddress : JSON.stringify(billingAddress),
          body.customer.firstName,
          body.customer.lastName,
          body.customer.email,
          body.customer.phone
        ]
      );
      
      // Get the inserted order ID
      const orderId = orderResult.insertId;
      
      // Insert order items
      for (const item of body.items) {
        await db.query(
          `INSERT INTO order_items 
            (orderId, productId, quantity, price, name) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            orderId,
            item.id, // Use item.id as productId
            item.quantity,
            item.price,
            item.name
          ]
        );
      }
      
      // Return the created order (but without payment information)
      return NextResponse.json(
        { 
          id: orderId,
          userId,
          total: body.total,
          status: 'pending',
          items: body.items,
          shippingAddress,
          billingAddress,
          customer: body.customer,
          createdAt: new Date().toISOString()
        }, 
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// GET: Fetch all orders for current user
export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view orders" },
        { status: 401 }
      );
    }
    
    // Get user ID and role from session
    const userId = parseInt(session.user.id as string, 10); // Ensure userId is an integer
    const isAdmin = session.user.role === 'admin';
    
    // Construct query to get orders
    let query = `
      SELECT o.*, GROUP_CONCAT(oi.id) as itemIds, 
             GROUP_CONCAT(oi.productId) as itemProductIds,
             GROUP_CONCAT(oi.name) as itemNames,
             GROUP_CONCAT(oi.quantity) as itemQuantities,
             GROUP_CONCAT(oi.price) as itemPrices
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.orderId
    `;
    
    // Add WHERE clause for non-admin users
    if (!isAdmin) {
      query += ' WHERE o.userId = ?';
    }
    
    query += ' GROUP BY o.id ORDER BY o.createdAt DESC';
    
    // Execute query with appropriate parameters
    const [rows] = await db.query(
      query,
      !isAdmin ? [userId] : []
    );
    
    // If no orders, return empty array
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return NextResponse.json([]);
    }
    
    // Process and format the results
    const orders = Array.isArray(rows) ? rows : [rows];
    
    const formattedOrders = orders.map((order: any) => {
      try {
        // Parse concatenated item data
        const itemIds = order.itemIds ? order.itemIds.split(',') : [];
        const itemProductIds = order.itemProductIds ? order.itemProductIds.split(',') : [];
        const itemNames = order.itemNames ? order.itemNames.split(',') : [];
        const itemQuantities = order.itemQuantities ? order.itemQuantities.split(',').map(Number) : [];
        const itemPrices = order.itemPrices ? order.itemPrices.split(',').map(Number) : [];
        
        // Build items array
        const items = itemIds.map((id: string, index: number) => ({
          id,
          productId: itemProductIds[index] || '',
          name: itemNames[index] || 'Unknown Product',
          quantity: itemQuantities[index] || 0,
          price: itemPrices[index] || 0
        }));
        
        // Parse address JSON strings
        let shippingAddress;
        let billingAddress;
        
        try {
          shippingAddress = order.shippingAddress ? 
            (typeof order.shippingAddress === 'string' ? JSON.parse(order.shippingAddress) : order.shippingAddress) 
            : null;
          
          billingAddress = order.billingAddress ? 
            (typeof order.billingAddress === 'string' ? JSON.parse(order.billingAddress) : order.billingAddress) 
            : null;
        } catch (error) {
          console.error("Error parsing address JSON:", error);
          shippingAddress = { error: "Could not parse address" };
          billingAddress = { error: "Could not parse address" };
        }
        
        // Format customer info
        const customer = {
          firstName: order.customerFirstName || '',
          lastName: order.customerLastName || '',
          email: order.customerEmail || '',
          phone: order.customerPhone || ''
        };
        
        // Return formatted order
        return {
          id: order.id,
          userId: order.userId || 'guest',
          total: parseFloat(order.total) || 0,
          status: order.status || 'processing',
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: order.paymentMethod || '',
          paymentDetails: order.paymentDetails ? 
            (typeof order.paymentDetails === 'string' ? JSON.parse(order.paymentDetails) : order.paymentDetails) 
            : {},
          items,
          shippingAddress,
          billingAddress,
          customer,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        };
      } catch (error) {
        console.error("Error formatting order:", error, order);
        // Return a minimal version of the order to avoid breaking the UI
        return {
          id: order.id || 'unknown',
          userId: order.userId || 'guest',
          total: parseFloat(order.total) || 0,
          status: 'error',
          items: [],
          customer: {
            firstName: '',
            lastName: '',
            email: '',
            phone: ''
          },
          createdAt: order.createdAt || new Date().toISOString(),
          error: "Error formatting order"
        };
      }
    });
    
    return NextResponse.json(formattedOrders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 