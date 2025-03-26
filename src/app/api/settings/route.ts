import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

// GET: Fetch public settings
export async function GET(request: NextRequest) {
  try {
    // Check if settings table exists
    const [tables] = await db.query("SHOW TABLES LIKE 'settings'");
    const tableExists = Array.isArray(tables) && tables.length > 0;

    if (!tableExists) {
      return NextResponse.json({
        general: {
          siteName: "Herbal Shop",
          description: "Your one-stop shop for herbal products",
          contactEmail: "contact@herbalshop.com",
          supportPhone: "+94 77 123 4567",
          address: "123 Green Lane, Colombo, Sri Lanka",
          currency: "USD",
          language: "en",
          logo: "/logo.png",
          favicon: "/favicon.ico",
        },
        layout: {
          theme: "light",
          primaryColor: "#10b981",
          secondaryColor: "#6366f1",
          headerLayout: "standard",
          footerLayout: "standard",
          productLayout: "grid",
          homepageLayout: "featured",
          sidebarPosition: "left",
          showRecentlyViewed: true,
          showRelatedProducts: true,
        }
      });
    }

    // Fetch only the public settings categories
    const publicCategories = ['general', 'layout', 'products'];
    const placeholders = publicCategories.map(() => '?').join(',');
    
    const [rows] = await db.query(
      `SELECT category, settings_data FROM settings WHERE category IN (${placeholders})`,
      publicCategories
    );
    
    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({
        general: {
          siteName: "Herbal Shop",
          description: "Your one-stop shop for herbal products",
        },
        layout: {
          theme: "light",
          primaryColor: "#10b981",
          secondaryColor: "#6366f1",
        }
      });
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

    // Ensure we have at least minimal default settings
    if (!settings.general) {
      settings.general = {
        siteName: "Herbal Shop",
        description: "Your one-stop shop for herbal products",
      };
    }
    
    if (!settings.layout) {
      settings.layout = {
        theme: "light",
        primaryColor: "#10b981",
        secondaryColor: "#6366f1",
      };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json(
      { 
        general: {
          siteName: "Herbal Shop",
          description: "Your one-stop shop for herbal products",
        },
        layout: {
          theme: "light",
          primaryColor: "#10b981",
          secondaryColor: "#6366f1",
        }
      },
      { status: 200 } // Return defaults with 200 status even on error
    );
  }
} 