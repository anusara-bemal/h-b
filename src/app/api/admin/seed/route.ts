import { NextResponse } from "next/server";
import db from "@/lib/mysql";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/utils";

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Check if tables exist and create them if they don't
    await createTables();
    
    // Seed example data for analytics
    await seedUsers();
    await seedCategories();
    await seedProducts();
    await seedOrders();
    
    return NextResponse.json({ 
      success: true, 
      message: "Database seeded with example data for analytics" 
    });
  } catch (error) {
    console.error("Error seeding database:", error);
    return NextResponse.json({ 
      error: "Failed to seed database", 
      message: (error as Error).message 
    }, { status: 500 });
  }
}

async function createTables() {
  try {
    // Check if tables exist
    const [tables] = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'herba_db'
    `);
    
    const existingTables = (tables as any[]).map(t => t.table_name);
    console.log("Existing tables:", existingTables);
    
    // Create users table if it doesn't exist
    if (!existingTables.includes('users')) {
      await db.query(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role ENUM('user', 'admin') DEFAULT 'user',
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("Users table created");
    }
    
    // Create categories table if it doesn't exist
    if (!existingTables.includes('categories')) {
      await db.query(`
        CREATE TABLE categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          image VARCHAR(255),
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log("Categories table created");
    }
    
    // Create products table if it doesn't exist
    if (!existingTables.includes('products')) {
      await db.query(`
        CREATE TABLE products (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) UNIQUE NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          image VARCHAR(255),
          stock INT NOT NULL DEFAULT 0,
          categoryId INT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (categoryId) REFERENCES categories(id) ON DELETE SET NULL
        )
      `);
      console.log("Products table created");
    }
    
    // Create orders table if it doesn't exist
    if (!existingTables.includes('orders')) {
      await db.query(`
        CREATE TABLE orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          userId INT,
          status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
          total DECIMAL(10, 2) NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
      console.log("Orders table created");
    }
    
    // Create order_items table if it doesn't exist
    if (!existingTables.includes('order_items')) {
      await db.query(`
        CREATE TABLE order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          orderId INT NOT NULL,
          productId INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(10, 2) NOT NULL,
          FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE,
          FOREIGN KEY (productId) REFERENCES products(id) ON DELETE RESTRICT
        )
      `);
      console.log("Order_items table created");
    }
  } catch (error) {
    console.error("Error creating tables:", error);
    throw error;
  }
}

async function seedUsers() {
  try {
    // Check if we already have users
    const [userCount] = await db.query("SELECT COUNT(*) as count FROM users");
    if ((userCount as any[])[0].count > 0) {
      console.log("Users already exist, skipping seed");
      return;
    }
    
    // Sample users
    const users = [
      { name: "Admin User", email: "admin@example.com", password: "$2b$10$UcP.NrLLtesQNVEBGKCp7OVvmD.V.E/ygngZz1.9eTwaN41Qfvkhy", role: "admin" },
      { name: "John Doe", email: "john@example.com", password: "$2b$10$UcP.NrLLtesQNVEBGKCp7OVvmD.V.E/ygngZz1.9eTwaN41Qfvkhy", role: "user" },
      { name: "Jane Smith", email: "jane@example.com", password: "$2b$10$UcP.NrLLtesQNVEBGKCp7OVvmD.V.E/ygngZz1.9eTwaN41Qfvkhy", role: "user" },
      { name: "Sam Wilson", email: "sam@example.com", password: "$2b$10$UcP.NrLLtesQNVEBGKCp7OVvmD.V.E/ygngZz1.9eTwaN41Qfvkhy", role: "user" }
    ];
    
    for (const user of users) {
      await db.query(`
        INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
      `, [user.name, user.email, user.password, user.role]);
    }
    
    console.log("Sample users created");
  } catch (error) {
    console.error("Error seeding users:", error);
    throw error;
  }
}

async function seedCategories() {
  try {
    // Check if we already have categories
    const [categoryCount] = await db.query("SELECT COUNT(*) as count FROM categories");
    if ((categoryCount as any[])[0].count > 0) {
      console.log("Categories already exist, skipping seed");
      return;
    }
    
    // Sample categories
    const categories = [
      { name: "Herbal Tea", slug: "herbal-tea", description: "Natural teas with health benefits" },
      { name: "Essential Oils", slug: "essential-oils", description: "Pure essential oils for aromatherapy" },
      { name: "Supplements", slug: "supplements", description: "Natural health supplements" },
      { name: "Herbs", slug: "herbs", description: "Natural dried herbs for cooking and wellness" }
    ];
    
    for (const category of categories) {
      await db.query(`
        INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)
      `, [category.name, category.slug, category.description]);
    }
    
    console.log("Sample categories created");
  } catch (error) {
    console.error("Error seeding categories:", error);
    throw error;
  }
}

async function seedProducts() {
  try {
    // Check if we already have products
    const [productCount] = await db.query("SELECT COUNT(*) as count FROM products");
    if ((productCount as any[])[0].count > 0) {
      console.log("Products already exist, skipping seed");
      return;
    }
    
    // Get category IDs
    const categories = await db.query("SELECT id, name FROM categories");
    const categoryMap = (categories as any[]).reduce((map, cat) => {
      map[cat.name] = cat.id;
      return map;
    }, {} as Record<string, number>);
    
    // Sample products
    const products = [
      {
        name: "Chamomile Tea",
        slug: "chamomile-tea",
        description: "Soothing chamomile tea to help with relaxation and sleep",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9",
        stock: 100,
        categoryId: categoryMap["Herbal Tea"]
      },
      {
        name: "Green Tea",
        slug: "green-tea",
        description: "Antioxidant-rich green tea to boost metabolism",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1627435601361-ec25f5b1d0e5",
        stock: 150,
        categoryId: categoryMap["Herbal Tea"]
      },
      {
        name: "Lavender Oil",
        slug: "lavender-oil",
        description: "Pure lavender essential oil for relaxation",
        price: 18.99,
        image: "https://images.unsplash.com/photo-1611081924871-e745253782a0",
        stock: 50,
        categoryId: categoryMap["Essential Oils"]
      },
      {
        name: "Eucalyptus Oil",
        slug: "eucalyptus-oil",
        description: "Refreshing eucalyptus oil for respiratory health",
        price: 16.99,
        image: "https://images.unsplash.com/photo-1575408264798-b50b252663e6",
        stock: 75,
        categoryId: categoryMap["Essential Oils"]
      },
      {
        name: "Ashwagandha",
        slug: "ashwagandha",
        description: "Natural supplement to reduce stress and anxiety",
        price: 24.99,
        image: "https://images.unsplash.com/photo-1603651468824-97a964a6a74f",
        stock: 60,
        categoryId: categoryMap["Supplements"]
      },
      {
        name: "Echinacea",
        slug: "echinacea",
        description: "Immune-boosting herbal supplement",
        price: 19.99,
        image: "https://images.unsplash.com/photo-1586155463380-2267ef76ac4c",
        stock: 80,
        categoryId: categoryMap["Supplements"]
      },
      {
        name: "Basil",
        slug: "basil",
        description: "Dried organic basil for cooking and health",
        price: 9.99,
        image: "https://images.unsplash.com/photo-1593099248621-5f756a6d45c6",
        stock: 120,
        categoryId: categoryMap["Herbs"]
      },
      {
        name: "Rosemary",
        slug: "rosemary",
        description: "Fragrant dried rosemary for cooking and aromatherapy",
        price: 10.99,
        image: "https://images.unsplash.com/photo-1582556135623-653219fcb5e3",
        stock: 110,
        categoryId: categoryMap["Herbs"]
      }
    ];
    
    for (const product of products) {
      await db.query(`
        INSERT INTO products (name, slug, description, price, image, stock, categoryId)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        product.name,
        product.slug,
        product.description,
        product.price,
        product.image,
        product.stock,
        product.categoryId
      ]);
    }
    
    console.log("Sample products created");
  } catch (error) {
    console.error("Error seeding products:", error);
    throw error;
  }
}

async function seedOrders() {
  try {
    // Check if we already have orders
    const [existingOrderCount] = await db.query("SELECT COUNT(*) as count FROM orders");
    if ((existingOrderCount as any[])[0].count > 0) {
      console.log("Orders already exist, skipping seed");
      return;
    }
    
    // Get user IDs
    const users = await db.query("SELECT id FROM users WHERE role = 'user'");
    const userIds = (users as any[]).map(user => user.id);
    
    // Get product IDs
    const products = await db.query("SELECT id, price FROM products");
    const productData = products as any[];
    
    // Generate orders for the past 30 days
    const statuses = ['pending', 'processing', 'completed', 'cancelled'];
    const today = new Date();
    
    // Create 30-50 random orders over the past 30 days
    const orderCount = Math.floor(Math.random() * 20) + 30;
    
    for (let i = 0; i < orderCount; i++) {
      // Random date within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30);
      const orderDate = new Date(today);
      orderDate.setDate(today.getDate() - daysAgo);
      
      // Random user
      const userId = userIds[Math.floor(Math.random() * userIds.length)];
      
      // Random status with higher probability for 'completed'
      const status = Math.random() < 0.6 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)];
      
      // Create order
      const [orderResult] = await db.query(`
        INSERT INTO orders (userId, status, total, createdAt)
        VALUES (?, ?, ?, ?)
      `, [userId, status, 0, orderDate]);
      
      const orderId = (orderResult as any).insertId;
      
      // Add 1-5 items to the order
      const itemCount = Math.floor(Math.random() * 4) + 1;
      let total = 0;
      
      // Select random products for this order
      const selectedProducts = [];
      for (let j = 0; j < itemCount; j++) {
        const product = productData[Math.floor(Math.random() * productData.length)];
        // Avoid duplicates
        if (!selectedProducts.includes(product.id)) {
          selectedProducts.push(product.id);
          
          const quantity = Math.floor(Math.random() * 3) + 1;
          const price = parseFloat(product.price);
          
          // Add order item
          await db.query(`
            INSERT INTO order_items (orderId, productId, quantity, price)
            VALUES (?, ?, ?, ?)
          `, [orderId, product.id, quantity, price]);
          
          total += price * quantity;
        }
      }
      
      // Update order total
      await db.query(`
        UPDATE orders SET total = ? WHERE id = ?
      `, [total, orderId]);
    }
    
    console.log(`${orderCount} sample orders created`);
  } catch (error) {
    console.error("Error seeding orders:", error);
    throw error;
  }
} 