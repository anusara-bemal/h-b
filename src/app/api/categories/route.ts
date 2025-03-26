import { NextResponse } from "next/server";
import db from "@/lib/mysql";

export async function GET() {
  try {
    // Get all categories with product count, but only published products
    const sql = `
      SELECT c.*, 
            COUNT(p.id) as productCount
      FROM categories c
      LEFT JOIN products p ON c.id = p.categoryId AND p.isPublished = 1
      GROUP BY c.id
      ORDER BY c.name ASC
    `;
    
    const categories = await db.query(sql);

    // Format the response to include only what the frontend needs
    const formattedCategories = categories.map((category: any) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      productCount: category.productCount || 0,
    }));

    return NextResponse.json(formattedCategories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
} 