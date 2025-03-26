import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind CSS classes with proper merging
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a price to a currency string (This is a legacy function, prefer using the useSettings hook's formatPrice)
 */
export function formatPrice(price: number, currency = "USD"): string {
  console.warn('Legacy formatPrice called. Consider using useSettings().formatPrice instead.');
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(price);
}

/**
 * Create a slug from a string
 */
export function createSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole?: string): boolean {
  return userRole === "admin";
}

/**
 * Check if user has admin access based on both role and email
 */
export function hasAdminAccess(userRole?: string, userEmail?: string): boolean {
  // Check by email first (for specific admin accounts)
  const adminEmails = ['admin@example.com', 'admin@herbalshop.com'];
  
  if (userEmail && adminEmails.includes(userEmail.toLowerCase())) {
    return true;
  }
  
  // Then check by role
  return userRole === "admin";
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, length = 100): string {
  if (text.length <= length) return text;
  return `${text.substring(0, length)}...`;
}

/**
 * Safely processes an image URL to ensure it's valid for the Next.js Image component
 * @param imageString The image URL or JSON string containing image URLs
 * @returns A valid image URL or placeholder
 */
export function getSafeImageUrl(imageString: string | string[] | null | undefined): string {
  const fallbackImage = '/images/placeholder.svg';
  
  // Handle null, undefined, or empty cases
  if (!imageString) return fallbackImage;
  
  // Handle empty array case specifically
  if (Array.isArray(imageString)) {
    if (imageString.length === 0) return fallbackImage;
    
    // Filter out empty strings and invalid values
    const validUrls = imageString
      .filter(url => url && typeof url === 'string' && url.trim() !== '')
      .map(url => url.trim());
      
    return validUrls.length > 0 ? getSafeUrl(validUrls[0]) : fallbackImage;
  }
  
  // Handle string case with extra validation
  if (typeof imageString === 'string') {
    // Handle empty strings
    if (imageString.trim() === '' || imageString === '[]' || imageString === '{}') {
      return fallbackImage;
    }
    
    // Try to parse as JSON if it's a string that looks like JSON
    if (imageString.startsWith('[') || imageString.startsWith('{')) {
      try {
        const parsed = JSON.parse(imageString);
        
        // Handle array from JSON
        if (Array.isArray(parsed)) {
          if (parsed.length === 0 || !parsed[0]) return fallbackImage;
          return typeof parsed[0] === 'string' ? getSafeUrl(parsed[0]) : fallbackImage;
        }
        
        // Handle object with url property
        if (parsed && typeof parsed === 'object' && parsed.url) {
          return typeof parsed.url === 'string' ? getSafeUrl(parsed.url) : fallbackImage;
        }
        
        return fallbackImage;
      } catch (e) {
        // If parsing fails, treat as a regular URL
        return getSafeUrl(imageString);
      }
    }
    
    // If it's a comma-separated list, take the first URL
    if (imageString.includes(',')) {
      const urls = imageString.split(',')
        .map(url => url.trim())
        .filter(url => url !== '');
        
      return urls.length > 0 ? getSafeUrl(urls[0]) : fallbackImage;
    }
    
    // It's a direct URL
    return getSafeUrl(imageString);
  }
  
  // Handle any other unexpected cases
  return fallbackImage;
  
  // Helper function to validate URLs
  function getSafeUrl(url: string): string {
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return fallbackImage;
    }
    
    // Trim any whitespace
    url = url.trim();
    
    // If it's a relative path, return as is
    if (url.startsWith('/')) {
      return url;
    }
    
    // Handle invalid example domains
    if (url.includes('storage.example.com') || 
        url.includes('example.com') || 
        url.includes('googleusercontent.com')) {
      return fallbackImage;
    }
    
    // Validate URL format
    try {
      new URL(url);
      return url;
    } catch (e) {
      // If it doesn't have a protocol, try adding https
      if (!url.startsWith('http')) {
        try {
          new URL(`https://${url}`);
          return `https://${url}`;
        } catch (e) {
          return fallbackImage;
        }
      }
      return fallbackImage;
    }
  }
}

/**
 * Validates if a URL is likely to be a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  // Check if it's a valid URL structure
  if (!url || typeof url !== 'string') return false;
  
  // Must start with http://, https://, or / for relative URLs
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('/')) {
    return false;
  }
  
  // Skip Google search result URLs which aren't direct image links
  if (url.includes('google.com/imgres?')) {
    return false;
  }
  
  return true;
} 