"use client";

import { useSettings } from "@/context/settings-context";
import { generateCssVariables } from "@/lib/theme-utils";
import { useEffect, useState } from "react";

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { settings, loading } = useSettings();
  const [isClient, setIsClient] = useState(false);
  
  // Flag for client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Apply theme settings
  useEffect(() => {
    if (loading || !isClient) return;
    
    console.log('ThemeProvider applying settings:', settings);
    
    // Toggle dark/light theme class
    const theme = settings.layout?.theme || 'light';
    document.body.classList.remove('dark-theme', 'light-theme');
    document.body.classList.add(`${theme}-theme`);
    
    // Apply CSS variables for colors
    const styleElement = document.getElementById('theme-variables') || document.createElement('style');
    if (!styleElement.id) styleElement.id = 'theme-variables';
    
    const cssVars = generateCssVariables(settings);
    styleElement.textContent = cssVars;
    
    if (!document.getElementById('theme-variables')) {
      document.head.appendChild(styleElement);
    }
    
    // Set favicon if it exists
    if (settings.favicon) {
      const existingFavicon = document.querySelector('link[rel="icon"]');
      if (existingFavicon) {
        existingFavicon.setAttribute('href', settings.favicon);
      } else {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.href = settings.favicon;
        document.head.appendChild(favicon);
      }
    }
    
    // Set description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && settings.description && settings.description !== 'Default store description') {
      metaDescription.setAttribute('content', settings.description);
    }
    
    // Set title
    if (settings.siteName) {
      document.title = settings.siteName;
    }
    
    console.log('Theme applied:', {
      theme,
      primaryColor: settings.layout?.primaryColor || '#10b981',
      secondaryColor: settings.layout?.secondaryColor || '#6366f1',
      cssVars
    });
    
  }, [settings, loading, isClient]);
  
  return children;
} 