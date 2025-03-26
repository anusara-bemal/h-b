import { NextResponse } from "next/server";
import db from "@/lib/mysql";

// Super simple direct update API
export async function POST(request: Request) {
  try {
    // Parse and log the raw request first
    const rawText = await request.text();
    console.log("Raw request body:", rawText);
    
    let itemId, quantity;
    
    try {
      // Parse the JSON
      const data = JSON.parse(rawText);
      console.log("Parsed request data:", data);
      
      // Extract and normalize values
      itemId = data.itemId ? String(data.itemId).trim() : null;
      quantity = data.quantity !== undefined ? Number(data.quantity) : undefined;
      
      console.log("Normalized values:", { itemId, quantity, 
        itemIdType: typeof itemId, 
        quantityType: typeof quantity,
        isQuantityNaN: isNaN(quantity)
      });
    } catch (parseError) {
      console.error("Failed to parse request JSON:", parseError);
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request" },
        { status: 400 }
      );
    }
    
    // Validate the required fields
    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid itemId" },
        { status: 400 }
      );
    }
    
    if (quantity === undefined || isNaN(quantity)) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid quantity" },
        { status: 400 }
      );
    }
    
    console.log("🔨 DIRECT SQL UPDATE for item:", itemId, "quantity:", quantity);
    
    let updateResult;
    
    // Check if this is a temporary ID (starts with temp_)
    if (itemId.startsWith('temp_')) {
      console.log("📌 Detected temporary ID, extracting product ID");
      
      try {
        // Extract the product ID from the temporary ID
        const productIdMatch = itemId.match(/temp_(\d+)_/);
        if (!productIdMatch) {
          throw new Error("Could not extract product ID from temporary ID");
        }
        
        const productId = productIdMatch[1];
        console.log("📦 Extracted product ID:", productId);
        
        // Get user ID from session
        const { cookies } = require('next/headers');
        const { getServerSession } = require('next-auth');
        const { authOptions } = require('@/lib/auth');
        
        // Get the session or cookie
        const session = await getServerSession(authOptions);
        const userId = session?.user?.id;
        const cookieStore = cookies();
        const guestId = cookieStore.get('guest_cart_id')?.value;
        const cartUserId = userId || guestId;
        
        console.log("🔍 Looking for cart with user ID:", cartUserId);
        
        // Get the cart ID
        const cartResult = await db.query(
          "SELECT id FROM carts WHERE userId = ? LIMIT 1",
          [cartUserId]
        );
        
        console.log("Cart query result:", JSON.stringify(cartResult).substring(0, 200));
        
        // Extract cart ID, handling different MySQL2 result formats
        let cartId = null;
        
        if (Array.isArray(cartResult)) {
          // Format could be [[{id: 'xxx'}], fields] or [{id: 'xxx'}]
          if (cartResult.length > 0) {
            if (Array.isArray(cartResult[0])) {
              // Format: [[{id: 'xxx'}], fields]
              if (cartResult[0].length > 0) {
                cartId = cartResult[0][0]?.id;
              }
            } else if (typeof cartResult[0] === 'object') {
              // Format: [{id: 'xxx'}]
              cartId = cartResult[0]?.id;
            }
          }
        } else if (cartResult && typeof cartResult === 'object') {
          // Format could be {0: {id: 'xxx'}, affectedRows: ...}
          cartId = cartResult[0]?.id;
        }
        
        console.log("Extracted cart ID:", cartId);
        
        if (!cartId) {
          console.log("Creating a new cart for user:", cartUserId);
          
          // Generate a UUID for the cart
          const uuidResult = await db.query("SELECT UUID() as uuid");
          console.log("UUID result:", JSON.stringify(uuidResult).substring(0, 200));
          
          let cartUuid = null;
          
          // Extract UUID using similar approach
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
            throw new Error("Failed to generate UUID for new cart");
          }
          
          // Create a new cart
          await db.query(
            "INSERT INTO carts (id, userId) VALUES (?, ?)",
            [cartUuid, cartUserId]
          );
          
          cartId = cartUuid;
          console.log("Created new cart with ID:", cartId);
        }
        
        console.log("🛒 Using cart ID:", cartId);
        
        // First check if the item exists
        const checkItemResult = await db.query(
          "SELECT id FROM cart_items WHERE cartId = ? AND productId = ?",
          [cartId, productId]
        );
        
        console.log("Check item result:", JSON.stringify(checkItemResult).substring(0, 200));
        
        let existingItemId = null;
        
        // Extract existing item ID using the same parsing logic
        if (Array.isArray(checkItemResult)) {
          if (checkItemResult.length > 0) {
            if (Array.isArray(checkItemResult[0])) {
              if (checkItemResult[0].length > 0) {
                existingItemId = checkItemResult[0][0]?.id;
              }
            } else if (typeof checkItemResult[0] === 'object') {
              existingItemId = checkItemResult[0]?.id;
            }
          }
        } else if (checkItemResult && typeof checkItemResult === 'object') {
          existingItemId = checkItemResult[0]?.id;
        }
        
        console.log("Existing item ID found:", existingItemId);
        
        // If item exists (even with empty ID) or has empty ID, update it
        if (existingItemId !== null) {
          console.log("Item exists with ID:", existingItemId || "EMPTY", "- updating quantity");
          
          if (quantity === 0) {
            // Delete the item - use productId and cartId since ID might be empty
            if (!existingItemId) {
              updateResult = await db.query(
                "DELETE FROM cart_items WHERE cartId = ? AND productId = ?",
                [cartId, productId]
              );
            } else {
              updateResult = await db.query(
                "DELETE FROM cart_items WHERE id = ?",
                [existingItemId]
              );
            }
          } else {
            // Update quantity - use productId and cartId since ID might be empty
            if (!existingItemId) {
              updateResult = await db.query(
                "UPDATE cart_items SET quantity = ? WHERE cartId = ? AND productId = ?",
                [quantity, cartId, productId]
              );
            } else {
              updateResult = await db.query(
                "UPDATE cart_items SET quantity = ? WHERE id = ?",
                [quantity, existingItemId]
              );
            }
          }
        } else {
          console.log("Item doesn't exist - adding new item to cart");
          
          if (quantity > 0) {
            // Generate a UUID for the new cart item
            const itemUuidResult = await db.query("SELECT UUID() as uuid");
            console.log("Item UUID result:", JSON.stringify(itemUuidResult).substring(0, 200));
            
            let itemUuid = null;
            
            // Extract UUID using similar approach
            if (Array.isArray(itemUuidResult)) {
              if (itemUuidResult.length > 0) {
                if (Array.isArray(itemUuidResult[0])) {
                  if (itemUuidResult[0].length > 0) {
                    itemUuid = itemUuidResult[0][0]?.uuid;
                  }
                } else if (typeof itemUuidResult[0] === 'object') {
                  itemUuid = itemUuidResult[0]?.uuid;
                }
              }
            } else if (itemUuidResult && typeof itemUuidResult === 'object') {
              itemUuid = itemUuidResult[0]?.uuid;
            }
            
            if (!itemUuid) {
              throw new Error("Failed to generate UUID for new cart item");
            }
            
            console.log("Generated cart item UUID:", itemUuid);
            
            // Only insert if quantity > 0 and include the UUID as the ID
            updateResult = await db.query(
              "INSERT INTO cart_items (id, cartId, productId, quantity) VALUES (?, ?, ?, ?)",
              [itemUuid, cartId, productId, quantity]
            );
          } else {
            // Nothing to delete, just return success
            console.log("Quantity is 0 and item doesn't exist - no action needed");
            return NextResponse.json({
              success: true,
              message: "No action needed",
              itemId,
              quantity,
              operation: "none"
            });
          }
        }
      } catch (error) {
        console.error("❌ Error handling temporary ID:", error);
        return NextResponse.json(
          { success: false, error: "Failed to process temporary ID: " + error.message },
          { status: 500 }
        );
      }
    } else {
      // Special handling for quantity = 0 (delete item)
      if (quantity === 0) {
        console.log("🗑️ Quantity is 0, DELETING item instead of updating");
        updateResult = await db.query(
          "DELETE FROM cart_items WHERE id = ?",
          [itemId]
        );
      } else {
        // Normal update for quantity > 0
        updateResult = await db.query(
          "UPDATE cart_items SET quantity = ? WHERE id = ?",
          [quantity, itemId]
        );
      }
    }
    
    console.log("DB operation result:", JSON.stringify(updateResult).substring(0, 200));
    
    // Check if the operation was successful by handling different result structures
    let affectedRows = 0;
    
    if (updateResult) {
      if (typeof updateResult.affectedRows === 'number') {
        affectedRows = updateResult.affectedRows;
      } else if (Array.isArray(updateResult) && updateResult.length > 0) {
        // For multi-level results like [[{affectedRows: x}], fields]
        if (typeof updateResult[0] === 'object') {
          if (updateResult[0].affectedRows !== undefined) {
            affectedRows = updateResult[0].affectedRows;
          } else if (Array.isArray(updateResult[0]) && updateResult[0].length > 0) {
            affectedRows = updateResult[0][0]?.affectedRows || 0;
          }
        }
      }
    }
    
    console.log("Affected rows:", affectedRows);
    
    if (affectedRows === 0 && itemId.startsWith('temp_') === false) {
      console.error("❌ DB operation did not affect any rows - item may not exist");
      return NextResponse.json(
        { success: false, error: "Item not found or no changes made" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: quantity === 0 ? "Item removed from cart" : `Quantity updated to ${quantity}`,
      itemId,
      quantity,
      operation: quantity === 0 ? "delete" : "update"
    });
  } catch (error) {
    console.error("Direct update error:", error);
    return NextResponse.json(
      { success: false, error: "Update failed: " + (error.message || "Unknown error") },
      { status: 500 }
    );
  }
} 