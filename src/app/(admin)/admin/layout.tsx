"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FaBoxOpen,
  FaHome,
  FaShoppingBag,
  FaUsers,
  FaCog,
  FaBars,
  FaChartBar,
  FaLeaf,
  FaTags,
  FaSignOutAlt,
  FaMoneyBillWave,
} from "react-icons/fa";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile on first render and when window resizes
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    // Check on mount
    checkIfMobile();
    
    // Add event listener for resize
    window.addEventListener("resize", checkIfMobile);
    
    // Clean up
    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navigation = [
    { name: "Dashboard", href: "/admin/dashboard", icon: FaHome },
    { name: "Products", href: "/admin/products", icon: FaBoxOpen },
    { name: "Categories", href: "/admin/categories", icon: FaTags },
    { name: "Orders", href: "/admin/orders", icon: FaShoppingBag },
    { name: "Users", href: "/admin/users", icon: FaUsers },
    { name: "Analytics", href: "/admin/analytics", icon: FaChartBar },
    { name: "Currencies", href: "/admin/currencies", icon: FaMoneyBillWave },
    { name: "Settings", href: "/admin/settings", icon: FaCog },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-30 h-full w-72 bg-white shadow-xl transition-transform duration-300 ease-in-out",
          isSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-20"
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href="/admin" className="flex items-center gap-3">
            <FaLeaf className="h-7 w-7 text-green-600" />
            <span
              className={cn(
                "font-semibold text-xl text-gray-900 transition-opacity duration-200",
                isSidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"
              )}
            >
              Herbal Admin
            </span>
          </Link>
        </div>

        {/* Sidebar content */}
        <div className="py-6">
          <div className="px-4 mb-4">
            <p className={cn(
              "text-xs font-semibold uppercase text-gray-500 mb-3 transition-opacity duration-200 pl-2",
              isSidebarOpen ? "opacity-100" : "opacity-0 lg:hidden"
            )}>
              Main Menu
            </p>
            <nav className="flex flex-col gap-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-all duration-200",
                    "hover:bg-gray-100 hover:text-green-700 group",
                    item.href === "/admin/dashboard"
                      ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-600"
                      : ""
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-all duration-200 group-hover:text-green-600"
                    )}
                  />
                  <span
                    className={cn(
                      "transition-all duration-200",
                      isSidebarOpen ? "opacity-100" : "opacity-0 hidden lg:inline-block"
                    )}
                  >
                    {item.name}
                  </span>
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Sidebar footer */}
        <div className="absolute bottom-0 w-full border-t p-4">
          <button
            onClick={() => console.log("Logout")}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200"
          >
            <FaSignOutAlt className="h-5 w-5 flex-shrink-0" />
            <span
              className={cn(
                "transition-opacity duration-200",
                isSidebarOpen ? "opacity-100" : "opacity-0 hidden lg:inline-block"
              )}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div
        className={cn(
          "transition-all duration-300 ease-in-out",
          isSidebarOpen
            ? "lg:ml-72"
            : "lg:ml-20"
        )}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 shadow-sm">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500 lg:hidden transition-all duration-200"
          >
            <FaBars className="h-6 w-6" />
          </button>

          {/* Header title */}
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-gray-900">Admin Panel</h1>
          </div>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block">
              <p className="font-medium text-gray-900">Admin User</p>
              <p className="text-sm text-gray-500">admin@herbalshop.com</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-semibold">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 md:p-8">{children}</main>

        {/* Footer */}
        <footer className="py-6 px-8 border-t">
          <p className="text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Herbal Shop Admin. All rights reserved.
          </p>
          <p className="text-center text-sm text-gray-500">
            Web Devolop By Anusara Bemal
          </p>
        </footer>
      </div>
    </div>
  );
} 