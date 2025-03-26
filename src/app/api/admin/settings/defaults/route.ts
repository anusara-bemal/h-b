import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/utils";

// Default settings
const defaultSettings = {
  general: {
    siteName: "Herbal Shop",
    siteDescription: "Your one-stop shop for herbal products",
    contactEmail: "contact@herbalshop.com",
    supportPhone: "+94 77 123 4567",
    address: "123 Green Lane, Colombo, Sri Lanka",
    currency: "LKR",
    language: "en",
    logo: "/logo.png",
    favicon: "/favicon.ico",
  },
  notifications: {
    emailNotifications: true,
    orderUpdates: true,
    stockAlerts: true,
    newCustomers: false,
    marketingEmails: false,
  },
  security: {
    twoFactorAuth: false,
    requireStrongPasswords: true,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  },
  products: {
    showOutOfStock: true,
    enableReviews: true,
    moderateReviews: true,
    enableWishlist: true,
    enableComparisons: false,
    productsPerPage: 12,
    defaultSorting: "newest",
  },
  shipping: {
    freeShippingThreshold: 5000,
    defaultShippingFee: 350,
    enableInternational: false,
    taxRate: 8,
    shippingZones: [
      { name: "Local (Colombo)", fee: 250 },
      { name: "Nearby Districts", fee: 350 },
      { name: "Other Areas", fee: 450 },
      { name: "Remote Areas", fee: 550 }
    ],
    expressDeliveryFee: 800,
    standardDeliveryTime: "2-3 days",
    expressDeliveryTime: "24 hours"
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
  },
  currencies: {
    active: "LKR",
    available: [
      { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee" },
      { code: "USD", symbol: "$", name: "US Dollar" },
      { code: "EUR", symbol: "€", name: "Euro" },
      { code: "GBP", symbol: "£", name: "British Pound" },
      { code: "INR", symbol: "₹", name: "Indian Rupee" }
    ],
    showCurrencySelector: true,
    updatePricesAutomatically: true,
  },
  languages: {
    active: "en",
    available: [
      { code: "en", name: "English" },
      { code: "si", name: "Sinhala" },
      { code: "ta", name: "Tamil" }
    ],
    showLanguageSelector: true,
    translateProductDescriptions: false,
  }
};

// GET: Return default settings
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    return NextResponse.json(defaultSettings);
  } catch (error) {
    console.error("Error returning default settings:", error);
    return NextResponse.json(
      { error: "Failed to get default settings" },
      { status: 500 }
    );
  }
}

// POST: Reset all settings to defaults
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !hasAdminAccess(session.user.role as string, session.user.email as string)) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // No request body needed, we're resetting to defaults
    
    return NextResponse.json({ 
      message: "Default settings returned successfully. Use these values to reset your settings.",
      settings: defaultSettings
    });
  } catch (error) {
    console.error("Error returning default settings:", error);
    return NextResponse.json(
      { error: "Failed to get default settings" },
      { status: 500 }
    );
  }
} 