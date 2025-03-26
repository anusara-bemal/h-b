"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Define settings types
export type ShippingZone = {
  name: string;
  fee: number;
};

export type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number; // Conversion rate from base currency (USD)
};

export type Language = {
  code: string;
  name: string;
};

export interface SiteSettings {
  siteName: string;
  description: string;
  contactEmail: string;
  supportPhone: string;
  address: string;
  currency: string;
  language: string;
  logo: string;
  favicon: string;
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
  shipping: {
    defaultShippingFee: number;
    freeShippingThreshold: number;
  };
  currencies: {
    active: string;
    available: {
      code: string;
      symbol: string;
      name: string;
      rate: number;
    }[];
    showCurrencySelector: boolean;
    updatePricesAutomatically: boolean;
  };
}

// Default settings
const defaultSettings: SiteSettings = {
  siteName: "Herbal Shop",
  description: "Your one-stop shop for herbal products",
  contactEmail: "contact@herbalshop.com",
  supportPhone: "+94 77 123 4567",
  address: "123 Green Lane, Colombo, Sri Lanka",
  currency: "USD",
  language: "en",
  logo: "/logo.png",
  favicon: "/favicon.ico",
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
  shipping: {
    defaultShippingFee: 1,
    freeShippingThreshold: 10
  },
  currencies: {
    active: "USD",
    available: [
      { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
      { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", rate: 320.5 },
      { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
      { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 }
    ],
    showCurrencySelector: true,
    updatePricesAutomatically: true
  }
};

// Define the context type
interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  setSettings: (settings: SiteSettings) => void;
  formatPrice: (price: number, currencyCode?: string) => string;
  convertPrice: (price: number, fromCurrency?: string, toCurrency?: string) => number;
  getCurrencySymbol: (currencyCode?: string) => string;
  setActiveCurrency: (currencyCode: string) => void;
  getShippingSettings: () => { fee: number; freeThreshold: number };
}

// Create the context
const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  setSettings: () => {},
  formatPrice: () => "",
  convertPrice: (price) => price,
  getCurrencySymbol: () => "$",
  setActiveCurrency: () => {},
  getShippingSettings: () => ({
    fee: defaultSettings.shipping?.defaultShippingFee || 1,
    freeThreshold: defaultSettings.shipping?.freeShippingThreshold || 10
  })
});

// Provider component
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  // Function to set active currency
  const setActiveCurrency = (currencyCode: string) => {
    if (!settings.currencies?.available.some(c => c.code === currencyCode)) {
      console.error(`Currency ${currencyCode} not available`);
      return;
    }

    setSettingsState(prev => ({
      ...prev,
      currencies: {
        ...prev.currencies!,
        active: currencyCode
      }
    }));
  };

  // Function to get currency symbol
  const getCurrencySymbol = (currencyCode?: string): string => {
    const code = currencyCode || settings.currencies?.active || 'USD';
    const currency = settings.currencies?.available.find(c => c.code === code);
    return currency?.symbol || '$';
  };

  // Function to convert price between currencies
  const convertPrice = (price: number, fromCurrency?: string, toCurrency?: string): number => {
    const from = fromCurrency || 'USD';
    const to = toCurrency || settings.currencies?.active || 'USD';
    
    // If same currency, no conversion needed
    if (from === to) return price;
    
    const fromRate = settings.currencies?.available.find(c => c.code === from)?.rate || 1;
    const toRate = settings.currencies?.available.find(c => c.code === to)?.rate || 1;
    
    // Convert to base currency (USD) first, then to target currency
    const priceInUSD = price / fromRate;
    return priceInUSD * toRate;
  };

  // Function to format price with currency symbol
  const formatPrice = (price: number, currencyCode?: string): string => {
    const code = currencyCode || settings.currencies?.active || 'USD';
    const convertedPrice = convertPrice(price, 'USD', code);
    const symbol = getCurrencySymbol(code);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      currencyDisplay: 'symbol'
    }).format(convertedPrice);
  };

  // Function to update settings
  const setSettings = async (newSettings: SiteSettings) => {
    try {
      // Update locally first for immediate UI feedback
      setSettingsState(prev => ({
        ...prev,
        ...newSettings
      }));
      
      // Then try to save to API
      console.log('Saving settings to API:', newSettings);
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      
      if (!response.ok) {
        console.error('Failed to save settings to API');
        // Could show a toast message here
      } else {
        console.log('Settings saved successfully to API');
        // Could show a success toast here
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  // Fetch settings from the API
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/settings');
        
        if (response.ok) {
          const data = await response.json();
          
          // If we have settings in the response, use them
          if (data && Object.keys(data).length > 0) {
            // Merge general settings with the top level and keep other categories
            const flattenedSettings: SiteSettings = {
              ...defaultSettings, // Apply defaults first
              ...(data.general || {}), // Spread general settings into the top level
              // Override with any remaining categories
              layout: data.layout || defaultSettings.layout,
              shipping: data.shipping,
              products: data.products,
              security: data.security,
              notifications: data.notifications,
              currencies: data.currencies || defaultSettings.currencies,
              languages: data.languages,
            };
            
            console.log('Applying settings:', flattenedSettings);
            setSettingsState(flattenedSettings);
          }
        } else {
          console.error('Failed to fetch settings from API:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading site settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Context value
  const contextValue: SettingsContextType = {
    settings,
    loading,
    setSettings,
    formatPrice,
    convertPrice,
    getCurrencySymbol,
    setActiveCurrency,
    getShippingSettings: () => ({
      fee: settings.shipping?.defaultShippingFee || 1,
      freeThreshold: settings.shipping?.freeShippingThreshold || 10
    })
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

// Custom hook to use settings
export const useSettings = () => useContext(SettingsContext); 