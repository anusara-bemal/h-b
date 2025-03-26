"use client";

import { useSettings } from "@/context/settings-context";
import Link from "next/link";
import { getThemeClasses } from "@/lib/theme-utils";

export default function Footer() {
  const { settings, loading } = useSettings();
  const currentYear = new Date().getFullYear();
  
  if (loading) {
    return (
      <footer className="bg-gray-50 border-t border-gray-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Loading footer...</p>
          </div>
        </div>
      </footer>
    );
  }
  
  // Use theme styling
  const themeBg = settings.layout?.theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const themeText = settings.layout?.theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const themeBorder = settings.layout?.theme === 'dark' ? 'border-gray-800' : 'border-gray-200';
  const themeHeading = settings.layout?.theme === 'dark' ? 'text-white' : 'text-gray-900';
  
  // Choose footer layout based on settings
  const renderFooterContent = () => {
    const footerLayout = settings.layout?.footerLayout || 'standard';
    
    switch (footerLayout) {
      case 'minimal':
        return (
          <div className="py-6 text-center">
            <p className={`text-sm ${themeText}`}>
              © {currentYear} {settings.siteName}. All rights reserved.
            </p>
          </div>
        );
        
      case 'detailed':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>{settings.siteName}</h3>
                <p className={`mt-2 text-sm ${themeText}`}>{settings.description}</p>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>Quick Links</h3>
                <ul className="mt-2 space-y-2">
                  <li><Link href="/about" className={`text-sm ${themeText} hover:text-primary`}>About Us</Link></li>
                  <li><Link href="/contact" className={`text-sm ${themeText} hover:text-primary`}>Contact</Link></li>
                  <li><Link href="/shipping" className={`text-sm ${themeText} hover:text-primary`}>Shipping Policy</Link></li>
                  <li><Link href="/return" className={`text-sm ${themeText} hover:text-primary`}>Return Policy</Link></li>
                </ul>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>Shop</h3>
                <ul className="mt-2 space-y-2">
                  <li><Link href="/products" className={`text-sm ${themeText} hover:text-primary`}>All Products</Link></li>
                  <li><Link href="/categories" className={`text-sm ${themeText} hover:text-primary`}>Categories</Link></li>
                  <li><Link href="/cart" className={`text-sm ${themeText} hover:text-primary`}>Shopping Cart</Link></li>
                  <li><Link href="/profile" className={`text-sm ${themeText} hover:text-primary`}>My Account</Link></li>
                </ul>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>Contact Info</h3>
                <ul className="mt-2 space-y-2">
                  <li className={`text-sm ${themeText}`}>Email: {settings.contactEmail}</li>
                  <li className={`text-sm ${themeText}`}>Phone: {settings.supportPhone}</li>
                  <li className={`text-sm ${themeText}`}>Address: {settings.address}</li>
                </ul>
              </div>
            </div>
            <div className={`mt-8 pt-8 border-t ${themeBorder}`}>
              <p className={`text-sm ${themeText} text-center`}>
                © {currentYear} {settings.siteName}. All rights reserved.
              </p>
              <p className={`text-sm ${themeText} text-center mt-2`}>
               Web Developed By Anusara Bemal
              </p>
            </div>
          </>
        );
        
      case 'columned':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>{settings.siteName}</h3>
                <p className={`mt-2 text-sm ${themeText}`}>{settings.description}</p>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>Quick Links</h3>
                <ul className="mt-2 space-y-2">
                  <li><Link href="/about" className={`text-sm ${themeText} hover:text-primary`}>About Us</Link></li>
                  <li><Link href="/contact" className={`text-sm ${themeText} hover:text-primary`}>Contact</Link></li>
                  <li><Link href="/products" className={`text-sm ${themeText} hover:text-primary`}>Shop</Link></li>
                  <li><Link href="/profile" className={`text-sm ${themeText} hover:text-primary`}>My Account</Link></li>
                </ul>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>Contact Info</h3>
                <ul className="mt-2 space-y-2">
                  <li className={`text-sm ${themeText}`}>Email: {settings.contactEmail}</li>
                  <li className={`text-sm ${themeText}`}>Phone: {settings.supportPhone}</li>
                  <li className={`text-sm ${themeText}`}>Address: {settings.address}</li>
                </ul>
              </div>
            </div>
            <div className={`mt-8 pt-8 border-t ${themeBorder}`}>
              <p className={`text-sm ${themeText} text-center`}>
                © {currentYear} {settings.siteName}. All rights reserved.
              </p>
            </div>
          </>
        );
        
      // Standard layout (default)
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>{settings.siteName}</h3>
                <p className={`mt-2 text-sm ${themeText}`}>{settings.description}</p>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>Quick Links</h3>
                <ul className="mt-2 space-y-2">
                  <li><Link href="/about" className={`text-sm ${themeText} hover:text-primary`}>About Us</Link></li>
                  <li><Link href="/contact" className={`text-sm ${themeText} hover:text-primary`}>Contact</Link></li>
                  <li><Link href="/shipping" className={`text-sm ${themeText} hover:text-primary`}>Shipping Policy</Link></li>
                  <li><Link href="/return" className={`text-sm ${themeText} hover:text-primary`}>Return Policy</Link></li>
                </ul>
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${themeHeading}`}>Contact Info</h3>
                <ul className="mt-2 space-y-2">
                  <li className={`text-sm ${themeText}`}>Email: {settings.contactEmail}</li>
                  <li className={`text-sm ${themeText}`}>Phone: {settings.supportPhone}</li>
                  <li className={`text-sm ${themeText}`}>Address: {settings.address}</li>
                </ul>
              </div>
            </div>
            <div className={`mt-8 pt-8 border-t ${themeBorder}`}>
              <p className={`text-sm ${themeText} text-center`}>
                © {currentYear} {settings.siteName}. All rights reserved.
              </p>
              <p className={`text-sm ${themeText} text-center mt-2`}>
               Web Developed By Anusara Bemal
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <footer className={`${themeBg} border-t ${themeBorder} py-12`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderFooterContent()}
      </div>
    </footer>
  );
} 