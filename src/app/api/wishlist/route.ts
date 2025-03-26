import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

// GET: Fetch user's wishlist
export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to view your wishlist" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // First, let's get a sample product to see what fields it has
    const [productSample] = await db.query('SELECT * FROM products LIMIT 1');
    console.log("Product sample:", JSON.stringify(productSample));
    
    // Query with the correct image field name
    const query = `
      SELECT w.id, w.productId, w.createdAt, 
             p.name, p.price, p.slug,
             p.images
      FROM wishlist w
      JOIN products p ON w.productId = p.id
      WHERE w.userId = ?
      ORDER BY w.createdAt DESC
    `;
    
    // Execute query
    const [rows] = await db.query(query, [userId]);
    console.log("Wishlist raw data:", JSON.stringify(rows));
    
    // Map the results to match the expected format
    const wishlistItems = (rows as any[]).map(row => {
      // Parse the images JSON string and get the first image
      let imageUrl = '/placeholders/product.svg';
      try {
        if (row.images) {
          const images = JSON.parse(row.images);
          if (Array.isArray(images) && images.length > 0) {
            imageUrl = images[0];
          }
        }
      } catch (e) {
        console.error("Error parsing images:", e);
      }
      
      return {
        id: row.id,
        productId: row.productId,
        name: row.name,
        price: row.price,
        image: imageUrl,
        slug: row.slug,
        createdAt: row.createdAt
      };
    });

    return NextResponse.json(wishlistItems);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Failed to fetch wishlist: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// POST: Add item to wishlist
export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to add items to your wishlist" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Parse request body
    const body = await request.json();
    
    // Validate request body
    if (!body.productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const [products] = await db.query(
      'SELECT id FROM products WHERE id = ?',
      [body.productId]
    );

    if ((products as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if already in wishlist
    const [existing] = await db.query(
      'SELECT id FROM wishlist WHERE userId = ? AND productId = ?',
      [userId, body.productId]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Product already in wishlist' },
        { status: 400 }
      );
    }

    // Generate a unique ID for the wishlist item
    const wishlistId = uuidv4();

    // Insert into wishlist
    await db.query(
      'INSERT INTO wishlist (id, userId, productId) VALUES (?, ?, ?)',
      [wishlistId, userId, body.productId]
    );
    
    return NextResponse.json({ 
      success: true, 
      message: "Item added to wishlist",
      wishlistId 
    });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Failed to add item to wishlist: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE: Remove item from wishlist
export async function DELETE(request: NextRequest) {
  try {
    // Get the user session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be logged in to remove items from your wishlist" },
        { status: 401 }
      );
    }
    
    // Get user ID from session
    const userId = session.user.id;
    
    // Get product ID from query parameters
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    
    if (!productId) {
      return NextResponse.json(
        { error: "Product ID is required" },
        { status: 400 }
      );
    }
    
    // Delete from wishlist
    const [result] = await db.query(
      'DELETE FROM wishlist WHERE userId = ? AND productId = ?',
      [userId, productId]
    );

    // Check if any rows were affected
    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Item not found in wishlist" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, message: "Item removed from wishlist" });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json(
      { error: "Failed to remove item from wishlist: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 