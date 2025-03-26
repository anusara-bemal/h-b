import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import { hasAdminAccess } from "@/lib/utils";

// GET: Fetch all settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Check if settings table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'settings'");
    const tableExists = Array.isArray(tables) && tables.length > 0;

    if (!tableExists) {
      // Create settings table if it doesn't exist
      await db.query(`
        CREATE TABLE settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(50) NOT NULL,
          settings_data JSON NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      return NextResponse.json({ message: "No settings found. Table created." });
    }

    // Fetch all settings
    const [rows] = await db.query("SELECT category, settings_data FROM settings");
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({});
    }

    // Convert the rows to a more usable format
    const settings = rows.reduce((acc: any, row: any) => {
      // Safely parse settings_data if it's a string, or use as is if it's already an object
      try {
        acc[row.category] = typeof row.settings_data === 'string' 
          ? JSON.parse(row.settings_data)
          : row.settings_data;
      } catch (err) {
        console.error(`Failed to parse settings for category ${row.category}:`, err);
        acc[row.category] = {}; // Use empty object as fallback
      }
      return acc;
    }, {});

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// POST: Save settings
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const data = await request.json();
    
    // Validate the settings data
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { error: "Invalid settings data" },
        { status: 400 }
      );
    }

    // Ensure settings table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'settings'");
    const tableExists = Array.isArray(tables) && tables.length > 0;

    if (!tableExists) {
      await db.query(`
        CREATE TABLE settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(50) NOT NULL,
          settings_data JSON NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }

    // Save each category of settings
    for (const [category, settings] of Object.entries(data)) {
      // Check if this category already exists
      const [existing] = await db.query(
        "SELECT id FROM settings WHERE category = ?",
        [category]
      );

      const settingsJson = JSON.stringify(settings);

      if (Array.isArray(existing) && existing.length > 0) {
        // Update existing category
        await db.query(
          "UPDATE settings SET settings_data = ? WHERE category = ?",
          [settingsJson, category]
        );
      } else {
        // Insert new category
        await db.query(
          "INSERT INTO settings (category, settings_data) VALUES (?, ?)",
          [category, settingsJson]
        );
      }
    }

    return NextResponse.json({ message: "Settings saved successfully" });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
} 