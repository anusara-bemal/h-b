import { NextResponse } from "next/server";
import db from "@/lib/mysql";

// Helper to ensure IDs are consistent
function normalizeId(id: any): number {
  if (typeof id === 'number') return id;
  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    console.log(`Product API: Fetching product with ID: ${id}, type: ${typeof id}`);
    
    // Get product with category info
    const sql = `
      SELECT p.*, 
             c.id as categoryId, 
             c.name as categoryName, 
             c.slug as categorySlug
      FROM products p
      LEFT JOIN categories c ON p.categoryId = c.id
      WHERE p.id = ? AND p.isPublished = 1
    `;
    
    const normalizedId = normalizeId(id);
    console.log(`Product API: Using normalized ID: ${normalizedId}`);
    
    const products = await db.query(sql, [normalizedId]);
    
    if (!products.length) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Format the result to match the expected format
    const product = products[0];
    const formattedProduct = {
      ...product,
      // Ensure ID is numeric
      id: normalizeId(product.id),
      category: product.categoryId ? {
        id: normalizeId(product.categoryId),
        name: product.categoryName,
        slug: product.categorySlug
      } : null
    };
    
    console.log(`Product API: Found product: ${formattedProduct.name}, ID: ${formattedProduct.id}`);
    
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
} 