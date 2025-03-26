"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

// Define settings types
export type ShippingZone = {
  name: string;
  fee: number;
};

export type Currency = {
  code: string;
  symbol: string;
  name: string;
};

export type Language = {
  code: string;
  name: string;
};

export interface SiteSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
    address: string;
    currency: string;
    language: string;
    logo: string;
    favicon: string;
  };
  notifications: {
    emailNotifications: boolean;
    orderUpdates: boolean;
    stockAlerts: boolean;
    newCustomers: boolean;
    marketingEmails: boolean;
  };
  security: {
    twoFactorAuth: boolean;
    requireStrongPasswords: boolean;
    sessionTimeout: number;
    maxLoginAttempts: number;
  };
  products: {
    showOutOfStock: boolean;
    enableReviews: boolean;
    moderateReviews: boolean;
    enableWishlist: boolean;
    enableComparisons: boolean;
    productsPerPage: number;
    defaultSorting: string;
  };
  shipping: {
    freeShippingThreshold: number;
    defaultShippingFee: number;
    enableInternational: boolean;
    taxRate: number;
    shippingZones: ShippingZone[];
    expressDeliveryFee: number;
    standardDeliveryTime: string;
    expressDeliveryTime: string;
  };
  layout: {
    theme: string;
    primaryColor: string;
    secondaryColor: string;
    headerLayout: string;
    footerLayout: string;
    productLayout: string;
    homepageLayout: string;
    sidebarPosition: string;
    showRecentlyViewed: boolean;
    showRelatedProducts: boolean;
  };
  currencies: {
    active: string;
    available: Currency[];
    showCurrencySelector: boolean;
    updatePricesAutomatically: boolean;
  };
  languages: {
    active: string;
    available: Language[];
    showLanguageSelector: boolean;
    translateProductDescriptions: boolean;
  };
}

// Default settings as fallback
const defaultSettings: SiteSettings = {
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

// Define the context type
interface SettingsContextType {
  settings: SiteSettings;
  isLoading: boolean;
  activeCurrency: Currency | null;
  activeLanguage: Language | null;
  formatPrice: (price: number) => string;
  getShippingCost: (zone?: string) => number;
}

// Create the context
const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  isLoading: true,
  activeCurrency: null,
  activeLanguage: null,
  formatPrice: (price) => `${price}`,
  getShippingCost: () => 0,
});

// Provider component
export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  
  // Find active currency and language objects
  const activeCurrency = settings.currencies.available.find(
    (c) => c.code === settings.currencies.active
  ) || null;
  
  const activeLanguage = settings.languages.available.find(
    (l) => l.code === settings.languages.active
  ) || null;

  // Format price based on active currency
  const formatPrice = (price: number): string => {
    const currency = activeCurrency || { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' };
    
    // Format with locale if browser supports it
    if (typeof Intl !== 'undefined') {
      try {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency.code,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(price);
      } catch (e) {
        // Fallback if the currency is not supported
        return `${currency.symbol} ${price.toFixed(2)}`;
      }
    }
    
    // Simple fallback
    return `${currency.symbol} ${price.toFixed(2)}`;
  };

  // Get shipping cost based on zone
  const getShippingCost = (zone?: string): number => {
    if (!zone) {
      return settings.shipping.defaultShippingFee;
    }
    
    const foundZone = settings.shipping.shippingZones.find(
      (z) => z.name.toLowerCase() === zone.toLowerCase()
    );
    
    return foundZone ? foundZone.fee : settings.shipping.defaultShippingFee;
  };

  // Fetch settings from the API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings');
        
        if (response.ok) {
          const data = await response.json();
          
          // If we have settings in the response, use them
          if (data && Object.keys(data).length > 0) {
            setSettings(data);
          }
        } else {
          // If response is not OK, fall back to defaults
          console.error('Failed to fetch settings from API');
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Context value
  const contextValue: SettingsContextType = {
    settings,
    isLoading,
    activeCurrency,
    activeLanguage,
    formatPrice,
    getShippingCost,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};

// Custom hook to use settings
export const useSettings = () => useContext(SettingsContext); 