import { SiteSettings } from "@/context/settings-context";

/**
 * Convert hex color to RGB components
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  hex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);

  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Generate CSS variables string from settings
 */
export function generateCssVariables(settings: SiteSettings): string {
  const primaryColor = settings.layout?.primaryColor || "#10b981";
  const secondaryColor = settings.layout?.secondaryColor || "#6366f1";
  
  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);
  
  return `
    :root {
      --primary-color: ${primaryColor};
      --primary-rgb: ${primaryRgb ? `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}` : '16, 185, 129'};
      --secondary-color: ${secondaryColor};
      --secondary-rgb: ${secondaryRgb ? `${secondaryRgb.r}, ${secondaryRgb.g}, ${secondaryRgb.b}` : '99, 102, 241'};
    }
  `;
}

/**
 * Get CSS class names based on theme settings
 */
export function getThemeClasses(settings: SiteSettings): {
  body: string;
  text: string;
  headings: string;
  borders: string;
  buttons: string;
} {
  const theme = settings.layout?.theme || 'light';
  
  return {
    body: `${theme}-theme`,
    text: `text-foreground`,
    headings: `text-foreground font-bold`,
    borders: `border-border`,
    buttons: `bg-primary text-white`,
  };
}

/**
 * Get metadata for the site
 */
export function getMetaData(settings: SiteSettings): {
  title: string;
  description: string;
  favicon: string;
} {
  return {
    title: settings.siteName || 'Herbal Shop',
    description: settings.description || 'Your one-stop shop for herbal products',
    favicon: settings.favicon || '/favicon.ico',
  };
} 