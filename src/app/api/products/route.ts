import { NextResponse } from "next/server";
import db from "@/lib/mysql";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const featured = searchParams.get("featured") === "true";
    const query = searchParams.get("query") || "";
    
    const filters: any = {};
    
    // Only show published products on the public API
    filters.isPublished = true;
    
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    if (featured) {
      filters.isFeatured = true;
    }
    
    if (query) {
      filters.query = query;
    }
    
    // Get products with their categories
    const products = await db.getProductsWithCategory(filters);
    
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
} 