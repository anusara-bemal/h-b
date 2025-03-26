import db from "@/lib/mysql";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/utils";

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

    // Drop existing tables
    await db.query("DROP TABLE IF EXISTS products");
    await db.query("DROP TABLE IF EXISTS categories");

    // Create categories table first
    await db.query(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Insert default categories
    await db.query(`
      INSERT INTO categories (name, slug, description) VALUES
      ('Herbs', 'herbs', 'Natural herbs collection'),
      ('Teas', 'teas', 'Herbal tea collection'),
      ('Essential Oils', 'essential-oils', 'Pure essential oils'),
      ('Supplements', 'supplements', 'Natural supplements')
    `);

    // Create products table
    await db.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        description TEXT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        salePrice DECIMAL(10, 2),
        categoryId INT,
        images JSON,
        inventory INT DEFAULT 0,
        isFeatured BOOLEAN DEFAULT FALSE,
        isPublished BOOLEAN DEFAULT TRUE,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Reset auto-increment counters
    await db.query("ALTER TABLE categories AUTO_INCREMENT = 1");
    await db.query("ALTER TABLE products AUTO_INCREMENT = 1");

    return NextResponse.json({ message: "Database tables reset successfully" });
  } catch (error) {
    console.error("Error resetting database tables:", error);
    return NextResponse.json(
      { error: "Failed to reset database tables" },
      { status: 500 }
    );
  }
} 