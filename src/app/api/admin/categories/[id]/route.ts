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
    
    // If no new file is uploaded, check if there's an existing image URL
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

// Get a single category
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Get the category
    const category = await db.findById('categories', id);
    
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// Update a category
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Check if category exists
    const category = await db.findById('categories', id);
    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }
    
    // Check content type to determine if it's a form or JSON
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data with file uploads
      const formData = await request.formData();
      
      // Process image upload
      const imageUrl = await handleImageUpload(formData);
      
      // Prepare data for database update
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Get basic fields from form data
      const name = formData.get('name');
      const description = formData.get('description');
      const slug = formData.get('slug');
      
      // Add fields to update data
      if (name) updateData.name = name.toString();
      if (description) updateData.description = description.toString();
      if (slug) updateData.slug = slug.toString();
      if (imageUrl) updateData.image = imageUrl;
      
      // Update the category
      const updatedCategory = await db.update('categories', id, updateData);
      
      return NextResponse.json(updatedCategory);
    } else {
      // Handle regular JSON request
      const body = await request.json();
      const { name, slug, description, imageUrl } = body;
      
      // Update with validation
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Only update fields that are provided
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (imageUrl !== undefined) updateData.image = imageUrl;
      
      // Update the category
      const updatedCategory = await db.update('categories', id, updateData);
      
      return NextResponse.json(updatedCategory);
    }
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// Delete a category
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Check if category exists
    const category = await db.findById('categories', id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }
    
    // Check if category has products (optional validation)
    const products = await db.findMany('products', { categoryId: id });
    if (products.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with associated products" },
        { status: 400 }
      );
    }
    
    // Delete the category
    await db.remove('categories', id);
    
    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 