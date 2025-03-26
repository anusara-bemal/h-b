import { NextResponse } from "next/server";
import db from "@/lib/mysql";

export async function GET(request: Request) {
  try {
    // Get the product ID from the query string
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    
    if (productId) {
      // Fetch a specific product
      const [products] = await db.query(
        "SELECT * FROM products WHERE id = ?",
        [productId]
      );
      
      if (!products || products.length === 0) {
        return NextResponse.json(
          { error: "Product not found", productId, searchQuery: `id = ${productId}` },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        message: "Product found",
        product: products[0],
        productId,
        productIdType: typeof productId,
        productIdInt: parseInt(productId, 10)
      });
    } else {
      // Get first few products from database
      const [products] = await db.query(
        "SELECT id, name, price, inventory FROM products LIMIT 10"
      );
      
      return NextResponse.json({
        message: "Products found",
        products
      });
    }
  } catch (error) {
    console.error("Debug API error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve product information" },
      { status: 500 }
    );
  }
} 