'use server';

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/mysql";
import { cookies } from "next/headers";

export async function getCartItemsCount() {
  try {
    // Get the session or guest ID
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    
    let guestId;
    if (!userId) {
      const cookieStore = cookies();
      guestId = cookieStore.get('guest_cart_id')?.value;
    }
    
    const cartUserId = userId || guestId;
    
    if (!cartUserId) return 0;
    
    // Query the database for cart items count
    const result = await db.query(
      `SELECT SUM(quantity) as count 
       FROM cart_items ci 
       JOIN carts c ON ci.cartId = c.id 
       WHERE c.userId = ?`,
      [cartUserId]
    );
    
    if (result && Array.isArray(result) && result.length > 0 && result[0].count) {
      return Number(result[0].count);
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting cart count:", error);
    return 0;
  }
} 