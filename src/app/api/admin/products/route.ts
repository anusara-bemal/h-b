import db from "@/lib/mysql";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from 'uuid';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import { hasAdminAccess } from "@/lib/utils";

// Helper function to create URL-friendly slugs
async function createUniqueSlug(name: string): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();

  let slug = baseSlug;
  let counter = 1;

  // Keep checking until we find a unique slug
  while (true) {
    // Check if slug exists
    const [existing] = await db.query(
      "SELECT id FROM products WHERE slug = ?",
      [slug]
    );

    if (!existing || (existing as any[]).length === 0) {
      return slug;
    }

    // If slug exists, append counter and try again
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Add a helper function to upload images
async function handleImageUpload(formData: FormData) {
  try {
    const uploadedImages = formData.getAll('images');
    const imageUrls: string[] = [];
    
    // If there are files, process them
    if (uploadedImages && uploadedImages.length > 0) {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
      
      try {
        if (!fs.existsSync(path.join(process.cwd(), 'public', 'uploads'))) {
          fs.mkdirSync(path.join(process.cwd(), 'public', 'uploads'));
        }
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
      } catch (mkdirError) {
        console.error('Error creating upload directory:', mkdirError);
      }
      
      // Process each file
      for (const image of uploadedImages) {
        if (image instanceof File) {
          const fileExtension = path.extname(image.name);
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension}`;
          const filePath = path.join(uploadDir, fileName);
          
          // Convert file to buffer
          const arrayBuffer = await image.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Write file to disk
          fs.writeFileSync(filePath, buffer);
          
          // Create URL relative to public folder
          const imageUrl = `/uploads/products/${fileName}`;
          imageUrls.push(imageUrl);
        }
      }
    }
    
    // Check if there were image URLs provided in imageUrls field
    const imageUrlsString = formData.get('imageUrls');
    if (imageUrlsString && typeof imageUrlsString === 'string' && imageUrlsString.trim()) {
      // Try to parse JSON first
      try {
        if (imageUrlsString.trim().startsWith('[')) {
          const existingImages = JSON.parse(imageUrlsString);
          if (Array.isArray(existingImages)) {
            imageUrls.push(...existingImages);
          }
        } else {
          // Otherwise split by comma
          const urls = imageUrlsString.split(',').map(url => url.trim()).filter(Boolean);
          imageUrls.push(...urls);
        }
      } catch (e) {
        // If parsing fails, just use the string as-is if it looks like a URL
        if (imageUrlsString.startsWith('http') || imageUrlsString.startsWith('/')) {
          imageUrls.push(imageUrlsString);
        }
      }
    }
    
    return imageUrls;
  } catch (error) {
    console.error('Error handling image upload:', error);
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const categoryId = searchParams.get('category') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (query) {
      whereClause += 'WHERE name LIKE ?';
      params.push(`%${query}%`);
      
      if (categoryId) {
        whereClause += ' AND categoryId = ?';
        params.push(categoryId);
      }
    } else if (categoryId) {
      whereClause += 'WHERE categoryId = ?';
      params.push(categoryId);
    }
    
    // Get total count - use db.query instead of db.execute
    const countResult = await db.query(
      `SELECT COUNT(*) as total FROM products ${whereClause}`,
      params
    );
    const total = countResult[0].total;
    
    // Get products - use db.query instead of db.execute
    const products = await db.query(
      `SELECT * FROM products ${whereClause} ORDER BY createdAt DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    
    return NextResponse.json({
      products,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const salePrice = formData.get("salePrice") 
      ? parseFloat(formData.get("salePrice") as string)
      : null;
    const inventory = parseInt(formData.get("inventory") as string);
    const categoryId = parseInt(formData.get("categoryId") as string);
    const isFeatured = formData.get("isFeatured") === "true";
    const isPublished = formData.get("isPublished") === "true";
    const images = formData.getAll("images") as File[];

    // Validate required fields
    if (!name || !description || isNaN(price) || isNaN(inventory) || isNaN(categoryId)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate category exists
    const [categoryResult] = await db.query(
      "SELECT id FROM categories WHERE id = ?",
      [categoryId]
    );
    const category = categoryResult as any[];
    
    if (!category || category.length === 0) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Create unique slug from name
    const slug = await createUniqueSlug(name);

    // Handle image uploads
    const imageUrls: string[] = [];
    for (const image of images) {
      if (image.size > 0) {
        const bytes = await image.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileExtension = path.extname(image.name);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
        
        // Ensure uploads directory exists
        if (!fs.existsSync(path.join(process.cwd(), "public", "uploads"))) {
          fs.mkdirSync(path.join(process.cwd(), "public", "uploads"), { recursive: true });
        }
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);
        imageUrls.push(`/uploads/products/${fileName}`);
      }
    }

    // Insert product with auto-incrementing ID
    const result = await db.query(
      `INSERT INTO products (
        name, slug, description, price, salePrice, 
        inventory, categoryId, images, isFeatured, 
        isPublished, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        slug,
        description,
        price,
        salePrice,
        inventory,
        categoryId,
        JSON.stringify(imageUrls),
        isFeatured ? 1 : 0,
        isPublished ? 1 : 0
      ]
    );

    const insertResult = result as any;
    const productId = insertResult.insertId;

    // Fetch the created product with category information
    const productResult = await db.query(
      `SELECT p.*, c.name as categoryName, c.slug as categorySlug 
       FROM products p 
       LEFT JOIN categories c ON p.categoryId = c.id 
       WHERE p.id = ?`,
      [productId]
    );

    const products = productResult as any[];
    if (!products || products.length === 0) {
      throw new Error("Failed to retrieve created product");
    }

    // Parse the images JSON string back into an array
    const product = {
      ...products[0],
      images: JSON.parse(products[0].images || '[]')
    };

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
} 