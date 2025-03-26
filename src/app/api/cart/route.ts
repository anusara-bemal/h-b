import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/mysql";
import { cookies } from "next/headers";

// Helper to get or create a cart
async function getOrCreateCart(userId?: string, skipCache: boolean = false) {
  let cart;
  let guestId;
  
  // If no userId (not authenticated), check for guest ID in cookies
  if (!userId) {
    const cookieStore = cookies();
    guestId = cookieStore.get('guest_cart_id')?.value;
    
    if (!guestId) {
      // Create a simple timestamp-based guest ID
      guestId = `guest_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      cookieStore.set('guest_cart_id', guestId, { 
        path: '/',
        maxAge: 60 * 60 * 24 * 30 // 30 days
      });
    }
  }
  
  const cartUserId = userId || guestId;
  console.log("Finding or creating cart for user:", cartUserId);
  
  if (cartUserId) {
    try {
      // Check for existing cart
      const cartResult = await db.query(
        `SELECT c.id, c.userId,
          JSON_ARRAYAGG(
            IF(ci.id IS NULL, NULL,
              JSON_OBJECT(
                'id', COALESCE(ci.id, UUID()),
                'quantity', ci.quantity,
                'product', JSON_OBJECT(
                  'id', p.id,
                  'name', p.name,
                  'price', p.price,
                  'salePrice', p.salePrice,
                  'images', p.images,
                  'inventory', p.inventory,
                  'description', LEFT(p.description, 100)
                )
              )
            )
          ) as items
        FROM carts c
        LEFT JOIN cart_items ci ON c.id = ci.cartId
        LEFT JOIN products p ON ci.productId = p.id
        WHERE c.userId = ?
        GROUP BY c.id`,
        [cartUserId]
      );
      
      console.log("Cart query results:", cartResult && cartResult.length > 0 ? "Found" : "Not found");
      
      let cartId, items = [];
      
      // Process cart result (handle different result formats)
      if (Array.isArray(cartResult) && cartResult.length > 0) {
        // The cart exists
        let cartData;
        
        if (Array.isArray(cartResult[0])) {
          cartData = cartResult[0][0];
        } else {
          cartData = cartResult[0];
        }
        
        if (cartData) {
          cartId = cartData.id;
          
          // Parse items JSON if it exists and isn't null
          const rawItems = cartData.items;
          console.log("Raw cart items data type:", typeof rawItems);
          
          try {
            // Filter out null entries and ensure all items have an ID
            if (rawItems && rawItems !== 'null') {
              const parsedItems = typeof rawItems === 'string' 
                ? JSON.parse(rawItems) 
                : rawItems;
              
              if (Array.isArray(parsedItems)) {
                items = parsedItems.filter(item => item !== null).map(item => {
                  // Ensure every item has an ID
                  if (!item.id) {
                    item.id = `temp_${item.product?.id}_${Date.now()}`;
                  }
                  return item;
                });
              }
            }
          } catch (error) {
            console.error("Error parsing cart items:", error);
            items = [];
          }
          
          console.log(`Cart found with ID ${cartId} and ${items.length} items`);
          
          // Return existing cart with properly formatted items
          return {
            id: cartId,
            userId: cartData.userId,
            items: items
          };
        }
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  }
  
  // Create a new cart if not found
  console.log("Creating new cart for user:", cartUserId);
  
  // Generate a UUID for the new cart
  const uuidResult = await db.query("SELECT UUID() as uuid");
  
  let cartUuid = null;
  
  // Extract UUID with consistent approach
  if (Array.isArray(uuidResult)) {
    if (uuidResult.length > 0) {
      if (Array.isArray(uuidResult[0])) {
        if (uuidResult[0].length > 0) {
          cartUuid = uuidResult[0][0]?.uuid;
        }
      } else if (typeof uuidResult[0] === 'object') {
        cartUuid = uuidResult[0]?.uuid;
      }
    }
  } else if (uuidResult && typeof uuidResult === 'object') {
    cartUuid = uuidResult[0]?.uuid;
  }
  
  if (!cartUuid) {
    console.error("Failed to generate UUID for new cart");
    throw new Error("Failed to create cart");
  }
  
  console.log("Creating new cart with ID:", cartUuid);
  
  // Insert new cart
  await db.query(
    "INSERT INTO carts (id, userId, createdAt) VALUES (?, ?, NOW())",
    [cartUuid, cartUserId]
  );
  
  // Return empty cart
  return {
    id: cartUuid,
    userId: cartUserId,
    items: []
  };
}

// Get cart items
export async function GET(request: Request) {
  try {
    // Get user ID from session
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    console.log("Finding cart for user:", userId);
    
    // Create or get cart
    const cartWithItems = await getOrCreateCart(userId);
    
    // Ensure all items have valid IDs
    if (cartWithItems.items && Array.isArray(cartWithItems.items)) {
      console.log("Cart items before processing:", cartWithItems.items);
      
      // Fix any items with empty IDs by assigning temporary IDs
      cartWithItems.items = cartWithItems.items.map(item => {
        if (item && (!item.id || item.id === '')) {
          // Generate a temporary ID based on productId
          console.log("Found item with empty ID, productId:", item.product?.id);
          item.id = `temp_${item.product?.id}_${Date.now()}`;
        }
        return item;
      }).filter(item => {
        // Still filter out null items and those without products
        return item && item.product && item.product.id;
      });
      
      console.log("Cart items after processing:", cartWithItems.items.length);
    }
    
    return NextResponse.json(cartWithItems);
  } catch (error) {
    console.error("Error getting cart:", error);
    return NextResponse.json(
      { error: "Failed to get cart: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

// POST to add an item to cart
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  try {
    const { productId, quantity } = await request.json();
    
    if (!productId || !quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Product ID and positive quantity are required" },
        { status: 400 }
      );
    }
    
    console.log("Adding product to cart:", { 
      productId, 
      productIdType: typeof productId, 
      quantity 
    });
    
    // Ensure productId is properly formatted for the database query
    let product = null;
    try {
      // For debugging - see the structure of the query result
      const result = await db.query("SELECT 1 as test");
      console.log("Query result structure:", JSON.stringify(result).substring(0, 100));
      
      // Try direct query first
      const productResult = await db.query(
        "SELECT * FROM products WHERE id = ?",
        [productId]
      );
      
      // Log the entire result to see its structure
      console.log("Product query result structure:", JSON.stringify(productResult).substring(0, 100));
      
      // Extract rows depending on the structure
      let products;
      if (Array.isArray(productResult) && productResult.length >= 1) {
        products = productResult[0]; // MySQL2 returns [rows, fields]
      } else {
        products = productResult; // Direct rows object
      }
      
      console.log("First query result:", products ? (Array.isArray(products) ? products.length : 1) : 0, "products found");
      
      if (products && (Array.isArray(products) ? products.length > 0 : true)) {
        product = Array.isArray(products) ? products[0] : products;
      }
      
      // If no product found, try with parsed integer
      if (!product) {
        console.log("Product not found with direct ID, trying parsed ID:", parseInt(productId, 10));
        const parsedResult = await db.query(
          "SELECT * FROM products WHERE id = ?",
          [parseInt(productId, 10)]
        );
        
        // Extract rows for second attempt
        let parsedProducts;
        if (Array.isArray(parsedResult) && parsedResult.length >= 1) {
          parsedProducts = parsedResult[0];
        } else {
          parsedProducts = parsedResult;
        }
        
        console.log("Second query result:", parsedProducts ? (Array.isArray(parsedProducts) ? parsedProducts.length : 1) : 0, "products found");
        
        if (parsedProducts && (Array.isArray(parsedProducts) ? parsedProducts.length > 0 : true)) {
          product = Array.isArray(parsedProducts) ? parsedProducts[0] : parsedProducts;
        }
      }
    } catch (error) {
      console.error("Error querying product:", error);
      return NextResponse.json(
        { error: "Error querying product database: " + (error instanceof Error ? error.message : String(error)) },
        { status: 500 }
      );
    }
    
    if (!product) {
      return NextResponse.json(
        { error: `Product not found with ID: ${productId}` },
        { status: 404 }
      );
    }
    
    console.log("Found product:", { id: (product as any).id, name: (product as any).name });
    
    if ((product as any).inventory < quantity) {
      return NextResponse.json(
        { error: "Not enough inventory available" },
        { status: 400 }
      );
    }
    
    // Get or create cart
    const cart = await getOrCreateCart(userId);
    console.log("Using cart:", { id: (cart as any).id, userId: (cart as any).userId });
    
    // Check if item already exists in cart
    const cartItemResult = await db.query(
      "SELECT * FROM cart_items WHERE cartId = ? AND productId = ?",
      [(cart as any).id, (product as any).id]
    );
    
    // Extract cart item rows
    let existingItems;
    if (Array.isArray(cartItemResult) && cartItemResult.length >= 1) {
      existingItems = cartItemResult[0];
    } else {
      existingItems = cartItemResult;
    }
    
    console.log("Existing cart items:", existingItems ? (Array.isArray(existingItems) ? existingItems.length : 1) : 0);
    
    if (existingItems && (Array.isArray(existingItems) ? existingItems.length > 0 : true)) {
      // Update existing item
      console.log("Updating existing cart item");
      await db.query(
        "UPDATE cart_items SET quantity = quantity + ? WHERE cartId = ? AND productId = ?",
        [quantity, (cart as any).id, (product as any).id]
      );
    } else {
      // Add new item to cart
      console.log("Adding new cart item");
      
      // Generate a UUID for the new cart item
      const uuidResult = await db.query("SELECT UUID() as uuid");
      console.log("UUID result structure:", JSON.stringify(uuidResult).substring(0, 200));
      
      let itemUuid = null;
      
      // Extract UUID using a consistent approach
      if (Array.isArray(uuidResult)) {
        if (uuidResult.length > 0) {
          if (Array.isArray(uuidResult[0])) {
            if (uuidResult[0].length > 0) {
              itemUuid = uuidResult[0][0]?.uuid;
            }
          } else if (typeof uuidResult[0] === 'object') {
            itemUuid = uuidResult[0]?.uuid;
          }
        }
      } else if (uuidResult && typeof uuidResult === 'object') {
        itemUuid = uuidResult[0]?.uuid;
      }
      
      if (!itemUuid) {
        console.error("Failed to generate UUID for new cart item");
        return NextResponse.json(
          { error: "Failed to create cart item" },
          { status: 500 }
        );
      }
      
      console.log("Generated UUID for cart item:", itemUuid);
      
      await db.query(
        "INSERT INTO cart_items (id, cartId, productId, quantity) VALUES (?, ?, ?, ?)",
        [itemUuid, (cart as any).id, (product as any).id, quantity]
      );
    }
    
    // Fetch updated cart
    const updatedCart = await getOrCreateCart(userId, true);
    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// PUT to update cart item quantity
export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  try {
    const { itemId, quantity } = await request.json();
    
    if (!itemId || quantity === undefined) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 }
      );
    }
    
    console.log("🔄 CART UPDATE REQUEST:", { itemId, quantity, userId });
    
    // Get user's cart
    const cart = await getOrCreateCart(userId);
    console.log("📂 Got cart with ID:", cart.id);
    
    // Check if the cart has a valid ID
    if (!cart || !cart.id) {
      console.error("❌ Invalid cart for update operation");
      return NextResponse.json(
        { error: "Your cart is invalid or not found" },
        { status: 404 }
      );
    }
    
    // DIRECT UPDATE APPROACH: Skip all the verification and just update by ID
    console.log("📝 DIRECT UPDATE - Setting quantity to:", quantity);
    
    try {
      // First, verify the item exists
      const verifyResult = await db.query(
        "SELECT id FROM cart_items WHERE id = ?",
        [itemId]
      );
      
      console.log("Item verification result:", verifyResult);
      
      if (!verifyResult || (Array.isArray(verifyResult) && verifyResult.length === 0)) {
        console.error(`❌ Cart item ${itemId} not found in database at all`);
        return NextResponse.json(
          { error: `Cart item not found with ID: ${itemId}` },
          { status: 404 }
        );
      }
      
      // Now do the direct update without any other conditions
      const updateResult = await db.query(
        "UPDATE cart_items SET quantity = ? WHERE id = ?",
        [quantity, itemId]
      );
      
      console.log("🔧 DIRECT Update result:", updateResult);
      
      // If the update was successful, we should see affected rows
      if (!updateResult || ((updateResult as any).affectedRows === 0)) {
        console.error("❌ Update query did not affect any rows");
        throw new Error("Update failed - no rows affected");
      }
      
      console.log("✅ UPDATE SUCCESSFUL with itemId", itemId);
    } catch (updateError) {
      console.error("❌ ERROR during direct update:", updateError);
      throw updateError;
    }
    
    // Force a short delay to ensure DB changes have propagated
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Fetch updated cart with fresh query
    const updatedCart = await getOrCreateCart(userId, true);
    console.log("✅ Returning updated cart with", updatedCart.items.length, "items");
    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error("❌ Error updating cart item:", error);
    return NextResponse.json(
      { error: "Failed to update cart item: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}

// DELETE to clear cart or remove specific item
export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    
    console.log("DELETE request for cart:", itemId ? `item ${itemId}` : "entire cart");
    
    // Get user's cart
    const cart = await getOrCreateCart(userId);
    console.log("Got cart with ID:", cart.id);
    
    // Check if cart ID is valid
    if (!cart.id) {
      console.error("Invalid cart ID for delete operation");
      return NextResponse.json(
        { error: "Invalid cart configuration" },
        { status: 400 }
      );
    }
    
    if (itemId) {
      // Verify the item belongs to this cart
      const itemResult = await db.query(
        "SELECT * FROM cart_items WHERE id = ? AND cartId = ?",
        [itemId, cart.id]
      );
      
      let itemExists = false;
      if (Array.isArray(itemResult) && itemResult.length > 0) {
        itemExists = true;
      }
      
      if (!itemExists) {
        console.log("Item not found in cart:", itemId);
        return NextResponse.json(
          { error: "Item not found in cart" },
          { status: 404 }
        );
      }
      
      // Delete specific item
      console.log("Deleting specific item from cart:", itemId);
      await db.query(
        "DELETE FROM cart_items WHERE id = ? AND cartId = ?",
        [itemId, cart.id]
      );
    } else {
      // Clear entire cart - ensure cart ID is valid
      console.log("Clearing entire cart:", cart.id);
      
      const result = await db.query(
        "DELETE FROM cart_items WHERE cartId = ?",
        [cart.id]
      );
      
      console.log("Cart cleared, affected rows:", result.affectedRows || 0);
    }
    
    // Create fresh cart to return
    const freshCart = { id: cart.id, userId: userId || "guest", items: [] };
    console.log("Returning empty cart");
    return NextResponse.json(freshCart);
  } catch (error) {
    console.error("Error deleting from cart:", error);
    return NextResponse.json(
      { error: "Failed to update cart: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 