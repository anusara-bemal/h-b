"use client";

import { cn } from "@/lib/utils";
import { hasAdminAccess } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { FaBars, FaShoppingCart, FaUser, FaTimes } from "react-icons/fa";
import { Button } from "./button";
import { CurrencySelector } from "./currency-selector";

interface NavbarProps {
  userRole?: string;
  userEmail?: string;
  cartItemsCount?: number;
}

export default function Navbar({ userRole, userEmail, cartItemsCount = 0 }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const userHasAdminAccess = hasAdminAccess(userRole, userEmail);

  return (
    <nav className="bg-white border-b border-gray-200 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex-shrink-0 flex items-center"
            >
              <span className="text-green-600 font-bold text-xl">HerbalShop</span>
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <NavLink href="/">Home</NavLink>
              <NavLink href="/products">Products</NavLink>
              <NavLink href="/categories">Categories</NavLink>
              <NavLink href="/about">About</NavLink>
              <NavLink href="/contact">Contact</NavLink>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
            <div className="mr-2">
              <CurrencySelector />
            </div>
            
            <Link 
              href="/cart" 
              className="p-2 text-gray-500 hover:text-green-600 relative"
              aria-label="Shopping Cart"
            >
              <FaShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-600 rounded-full">
                  {cartItemsCount}
                </span>
              )}
            </Link>
            
            {userRole ? (
              <div className="flex items-center space-x-2">
                {userHasAdminAccess && (
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden md:inline-flex"
                    >
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button 
                    variant="default"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <FaUser className="h-4 w-4" />
                    <span>Profile</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
          
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-green-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
              aria-controls="mobile-menu"
              aria-expanded={isMenuOpen}
              onClick={toggleMenu}
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <FaTimes className="block h-6 w-6" />
              ) : (
                <FaBars className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "sm:hidden transition-all duration-300 ease-in-out",
          isMenuOpen ? "max-h-screen" : "max-h-0 overflow-hidden"
        )}
        id="mobile-menu"
      >
        <div className="pt-2 pb-3 space-y-1">
          <MobileNavLink href="/">Home</MobileNavLink>
          <MobileNavLink href="/products">Products</MobileNavLink>
          <MobileNavLink href="/categories">Categories</MobileNavLink>
          <MobileNavLink href="/about">About</MobileNavLink>
          <MobileNavLink href="/contact">Contact</MobileNavLink>
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <CurrencySelector />
              
              <Link 
                href="/cart" 
                className="p-2 text-gray-500 hover:text-green-600 relative"
                aria-label="Shopping Cart"
              >
                <FaShoppingCart className="h-5 w-5" />
                {cartItemsCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-green-600 rounded-full">
                    {cartItemsCount}
                  </span>
                )}
              </Link>
            </div>
            
            {userRole ? (
              <div className="flex items-center space-x-4">
                {userHasAdminAccess && (
                  <Link href="/admin">
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Admin
                    </Button>
                  </Link>
                )}
                <Link href="/profile">
                  <Button 
                    variant="default"
                    size="sm"
                    className="flex items-center space-x-2"
                  >
                    <FaUser className="h-4 w-4" />
                    <span>Profile</span>
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:space-x-2">
                <Link href="/login" className="w-full">
                  <Button variant="outline" size="sm" className="w-full">
                    Login
                  </Button>
                </Link>
                <Link href="/register" className="w-full">
                  <Button size="sm" className="w-full">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center px-1 pt-1 border-b-2 border-transparent text-sm font-medium text-gray-500 hover:text-gray-900 hover:border-green-500"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 hover:border-green-500"
    >
      {children}
    </Link>
  );
} 