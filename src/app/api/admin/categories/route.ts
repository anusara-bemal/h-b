import { NextResponse } from "next/server";
import db from "@/lib/mysql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import { hasAdminAccess } from "@/lib/utils";

// Helper function to handle image upload
async function handleImageUpload(formData: FormData) {
  try {
    const uploadedImage = formData.get('categoryImage');
    
    // If there is a file, process it
    if (uploadedImage && uploadedImage instanceof File) {
      // Create uploads directory if it doesn't exist
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'categories');
      
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
      
      const fileExtension = path.extname(uploadedImage.name);
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension}`;
      const filePath = path.join(uploadDir, fileName);
      
      // Convert file to buffer
      const arrayBuffer = await uploadedImage.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Write file to disk
      fs.writeFileSync(filePath, buffer);
      
      // Create URL relative to public folder
      return `/uploads/categories/${fileName}`;
    }
    
    // If no file is uploaded, check if there's an image URL provided
    const imageUrl = formData.get('imageUrl');
    if (imageUrl && typeof imageUrl === 'string' && imageUrl.trim()) {
      return imageUrl;
    }
    
    return null;
  } catch (error) {
    console.error('Error handling image upload:', error);
    return null;
  }
}

// Get all categories
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin for admin routes
    if (request.url.includes('/api/admin/')) {
      if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    }
    
    // Replace findAll with a direct query since findAll doesn't exist
    const categories = await db.query('SELECT * FROM categories ORDER BY name');
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// Create a new category
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
    const image = formData.get("categoryImage") as File;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    // Create slug from name
    const slug = createSlug(name);

    // Handle image upload
    let imageUrl = null;
    if (image && image.size > 0) {
      const bytes = await image.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `${Date.now()}-${image.name}`;
      
      // Create directory path for categories
      const uploadDir = path.join(process.cwd(), "public", "uploads", "categories");
      const filePath = path.join(uploadDir, fileName);
      
      // Ensure uploads directory exists with categories subdirectory
      if (!fs.existsSync(path.join(process.cwd(), "public", "uploads"))) {
        fs.mkdirSync(path.join(process.cwd(), "public", "uploads"), { recursive: true });
      }
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      fs.writeFileSync(filePath, buffer);
      imageUrl = `/uploads/categories/${fileName}`;
    }

    // Insert category
    const result = await db.query(
      `INSERT INTO categories (name, slug, description, image, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
      [name, slug, description, imageUrl]
    );

    const insertResult = result as any;
    const categoryId = insertResult.insertId;

    // Fetch the created category
    const categoryResult = await db.query(
      "SELECT * FROM categories WHERE id = ?",
      [categoryId]
    );

    const categories = categoryResult as any[];
    if (!categories || categories.length === 0) {
      throw new Error("Failed to retrieve created category");
    }

    return NextResponse.json(categories[0]);
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// Helper function to create URL-friendly slugs
function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .trim();
} 