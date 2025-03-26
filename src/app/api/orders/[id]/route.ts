import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";

// GET: Fetch a single order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view order details" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Check if user is admin
    const isAdmin = session.user.role === 'admin';
    
    // Query to fetch order with its items
    const query = `
      SELECT o.*, 
             GROUP_CONCAT(oi.id) as itemIds, 
             GROUP_CONCAT(oi.productId) as itemProductIds,
             GROUP_CONCAT(oi.name) as itemNames,
             GROUP_CONCAT(oi.quantity) as itemQuantities,
             GROUP_CONCAT(oi.price) as itemPrices
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.orderId
      WHERE o.id = ? ${!isAdmin ? 'AND o.userId = ?' : ''}
      GROUP BY o.id
    `;
    
    // Execute query with appropriate parameters
    const [rows] = await db.query(
      query,
      !isAdmin ? [orderId, userId] : [orderId]
    );
    
    // Check if order exists and user has access
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return NextResponse.json(
        { error: "Order not found or you don't have permission to view it" },
        { status: 404 }
      );
    }
    
    // Get the order from result
    const order = Array.isArray(rows) ? rows[0] : rows;
    
    // Parse concatenated item data
    const itemIds = order.itemIds ? order.itemIds.split(',') : [];
    const itemProductIds = order.itemProductIds ? order.itemProductIds.split(',') : [];
    const itemNames = order.itemNames ? order.itemNames.split(',') : [];
    const itemQuantities = order.itemQuantities ? order.itemQuantities.split(',').map(Number) : [];
    const itemPrices = order.itemPrices ? order.itemPrices.split(',').map(Number) : [];
    
    // Build items array
    const items = itemIds.map((id: string, index: number) => ({
      id,
      productId: itemProductIds[index],
      name: itemNames[index],
      quantity: itemQuantities[index],
      price: itemPrices[index]
    }));
    
    // Parse address JSON strings
    let shippingAddress;
    let billingAddress;
    
    try {
      shippingAddress = order.shippingAddress ? JSON.parse(order.shippingAddress) : null;
      billingAddress = order.billingAddress ? JSON.parse(order.billingAddress) : null;
    } catch (error) {
      console.error("Error parsing address JSON:", error);
      shippingAddress = null;
      billingAddress = null;
    }
    
    // Format customer info
    const customer = {
      firstName: order.customerFirstName,
      lastName: order.customerLastName,
      email: order.customerEmail,
      phone: order.customerPhone
    };
    
    // Return formatted order
    const formattedOrder = {
      id: order.id,
      userId: order.userId,
      total: order.total,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      items,
      shippingAddress,
      billingAddress,
      customer,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    };
    
    return NextResponse.json(formattedOrder);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Failed to fetch order: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PATCH: Update order status (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id;
    
    // Verify user is authenticated and is admin
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to update orders" },
        { status: 401 }
      );
    }
    
    // Only admins can update orders
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: "Only admins can update order status" },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    let updateField = '';
    let updateValue = '';
    
    // Check which field to update (status or paymentStatus)
    if (body.status) {
      // Validate status value
      const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'canceled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      
      updateField = 'status';
      updateValue = body.status;
    } else if (body.paymentStatus) {
      // Validate payment status value
      const validPaymentStatuses = ['pending', 'paid', 'failed'];
      if (!validPaymentStatuses.includes(body.paymentStatus)) {
        return NextResponse.json(
          { error: `Invalid payment status. Must be one of: ${validPaymentStatuses.join(', ')}` },
          { status: 400 }
        );
      }
      
      updateField = 'paymentStatus';
      updateValue = body.paymentStatus;
    } else {
      return NextResponse.json(
        { error: "Status or paymentStatus is required" },
        { status: 400 }
      );
    }
    
    // Update order in database
    const [result] = await db.query(
      `UPDATE orders SET ${updateField} = ? WHERE id = ?`,
      [updateValue, orderId]
    );
    
    // Check if order exists
    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }
    
    // Return success response
    return NextResponse.json({
      message: `Order ${updateField} updated to ${updateValue}`,
      orderId,
      [updateField]: updateValue
    });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 