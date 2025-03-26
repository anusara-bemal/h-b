import { NextResponse } from "next/server";
import db from "@/lib/mysql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import fs from 'fs';
import path from 'path';

// Helper function to handle image upload
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

// GET a specific product
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Get product with category info
    const sql = `
      SELECT p.*, 
             c.id as categoryId, 
             c.name as categoryName, 
             c.slug as categorySlug
      FROM products p
      JOIN categories c ON p.categoryId = c.id
      WHERE p.id = ?
    `;
    
    const products = await db.query(sql, [id]);
    
    if (!products.length) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Format the result to match the Prisma format
    const product = products[0];
    const formattedProduct = {
      ...product,
      category: {
        id: product.categoryId,
        name: product.categoryName,
        slug: product.categorySlug
      }
    };
    
    return NextResponse.json(formattedProduct);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT to update a product
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
    
    // Check if product exists
    const product = await db.findById('products', id);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Check content type to determine if it's a form or JSON
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle multipart form data with file uploads
      const formData = await request.formData();
      
      // Process image uploads
      const imageUrls = await handleImageUpload(formData);
      
      // Prepare data for database update
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Get basic fields from form data
      const name = formData.get('name');
      const description = formData.get('description');
      const price = formData.get('price');
      const salePrice = formData.get('salePrice');
      const inventory = formData.get('inventory');
      const categoryId = formData.get('categoryId');
      const slug = formData.get('slug');
      const isFeatured = formData.get('isFeatured');
      const isPublished = formData.get('isPublished');
      
      // Add fields to update data
      if (name) updateData.name = name.toString();
      if (description) updateData.description = description.toString();
      if (price) updateData.price = parseFloat(price.toString());
      if (salePrice) updateData.salePrice = salePrice ? parseFloat(salePrice.toString()) : null;
      if (inventory) updateData.inventory = parseInt(inventory.toString()) || 0;
      if (categoryId) updateData.categoryId = categoryId.toString();
      if (slug) updateData.slug = slug.toString();
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true';
      if (isPublished !== undefined) updateData.isPublished = isPublished === 'true';
      
      // Add images if we got any
      if (imageUrls.length > 0) {
        updateData.images = JSON.stringify(imageUrls);
      }
      
      // Update the product
      const updatedProduct = await db.update('products', id, updateData);
      
      // Fetch the updated product with category
      const sql = `
        SELECT p.*, 
               c.id as categoryId, 
               c.name as categoryName, 
               c.slug as categorySlug
        FROM products p
        JOIN categories c ON p.categoryId = c.id
        WHERE p.id = ?
      `;
      
      const products = await db.query(sql, [id]);
      const formattedProduct = {
        ...products[0],
        category: {
          id: products[0].categoryId,
          name: products[0].categoryName,
          slug: products[0].categorySlug
        }
      };
      
      return NextResponse.json(formattedProduct);
    } else {
      // Handle regular JSON request
      const body = await request.json();
      const { 
        name, slug, description, price, salePrice, 
        inventory, categoryId, images, isFeatured, isPublished 
      } = body;
      
      // Update with validation
      const updateData: any = {
        updatedAt: new Date()
      };
      
      // Only update fields that are provided
      if (name !== undefined) updateData.name = name;
      if (slug !== undefined) updateData.slug = slug;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = parseFloat(price);
      if (salePrice !== undefined) updateData.salePrice = salePrice ? parseFloat(salePrice) : null;
      if (inventory !== undefined) updateData.inventory = parseInt(inventory) || 0;
      if (categoryId !== undefined) {
        // Verify category exists
        const category = await db.findById('categories', categoryId);
        if (!category) {
          return NextResponse.json(
            { error: "Category not found" },
            { status: 400 }
          );
        }
        updateData.categoryId = categoryId;
      }
      if (images !== undefined) updateData.images = images;
      if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
      if (isPublished !== undefined) updateData.isPublished = isPublished;
      
      // Update the product
      const updatedProduct = await db.update('products', id, updateData);
      
      // Fetch the updated product with category
      const sql = `
        SELECT p.*, 
               c.id as categoryId, 
               c.name as categoryName, 
               c.slug as categorySlug
        FROM products p
        JOIN categories c ON p.categoryId = c.id
        WHERE p.id = ?
      `;
      
      const products = await db.query(sql, [id]);
      const formattedProduct = {
        ...products[0],
        category: {
          id: products[0].categoryId,
          name: products[0].categoryName,
          slug: products[0].categorySlug
        }
      };
      
      return NextResponse.json(formattedProduct);
    }
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE a product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check if user is admin
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const id = params.id;
    
    // Check if product exists
    const product = await db.findById('products', id);
    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }
    
    // Delete the product
    await db.remove('products', id);
    
    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
} 