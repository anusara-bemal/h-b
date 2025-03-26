"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatPrice, getSafeImageUrl } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  FaPlus,
  FaSearch,
  FaSort,
  FaFilter,
  FaCheck,
  FaTimes,
  FaEye,
  FaPencilAlt,
  FaTrash,
  FaBoxOpen,
  FaSpinner,
} from "react-icons/fa";
import Image from "next/image";

// Product type definition
type Product = {
  id: number;
  name: string;
  price: number;
  inventory: number;
  isPublished: boolean;
  createdAt: string;
  images: string;
  category: {
    id: number;
    name: string;
    slug: string;
  };
};

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "ascending" | "descending";
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState("");

  // Fetch products from the database
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/admin/products');
        if (!response.ok) {
          throw new Error('Failed to fetch products');
        }
        const data = await response.json();
        setProducts(data.products || []);
        
        // Extract unique categories
        const uniqueCategories = Array.from(
          new Set((data.products || []).map((product: Product) => product.category?.name).filter(Boolean))
        );
        setCategories(uniqueCategories as string[]);
      } catch (error) {
        console.error('Error fetching products:', error);
        setError('Failed to load products. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Filtered and sorted products
  const filteredAndSortedProducts = products
    .filter((product) => {
      // Apply search filter
      const matchesSearch = searchQuery 
        ? product.name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      // Apply category filter
      const matchesCategory = filterCategory
        ? product.category?.name === filterCategory
        : true;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (!sortConfig) return 0;
      
      // Handle different keys for sorting
      if (sortConfig.key === 'category') {
        const aValue = a.category.name;
        const bValue = b.category.name;
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // For other fields
      const aValue = a[sortConfig.key as keyof typeof a];
      const bValue = b[sortConfig.key as keyof typeof b];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      // For numbers
      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // Handle publish/unpublish
  const togglePublished = async (id: number) => {
    setIsLoading(true);
    try {
      // Find the product to toggle
      const product = products.find(p => p.id === id);
      if (!product) return;
      
      // Call the API to update the product
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublished: !product.isPublished
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update product');
      }
      
      // Update the local state
      setProducts(
        products.map((product) =>
          product.id === id
            ? { ...product, isPublished: !product.isPublished }
            : product
        )
      );
    } catch (error) {
      console.error('Error updating product:', error);
      setError('Failed to update product. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete
  const deleteProduct = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsLoading(true);
      try {
        // Call the API to delete the product
        const response = await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete product');
        }
        
        // Update the local state
        setProducts(products.filter((product) => product.id !== id));
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Replace the getImageUrl function with our utility function
  const getImageUrl = getSafeImageUrl;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">Manage your product inventory</p>
        </div>
        <Link href="/admin/products/create" className="mt-4 md:mt-0">
          <Button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200">
            <FaPlus className="h-4 w-4" />
            Add New Product
          </Button>
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <Card className="border-none shadow-md overflow-hidden mb-8">
        <CardHeader className="bg-gray-50 px-6 py-5 border-b">
          <CardTitle className="flex items-center text-gray-900">
            <FaBoxOpen className="mr-2 h-5 w-5 text-green-600" />
            Products
            <span className="ml-2 text-sm font-normal text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
              {filteredAndSortedProducts.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <FaFilter className="text-gray-400" />
              <select
                className="flex-1 h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterCategory("");
                  setSortConfig(null);
                }}
                className="border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <FaSpinner className="animate-spin h-8 w-8 text-green-500" />
            </div>
          ) : (
            <>
              {filteredAndSortedProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 text-gray-900 text-sm">
                      <tr>
                        <th className="px-6 py-3 text-left font-medium">
                          <button
                            onClick={() => requestSort('name')}
                            className="flex items-center text-gray-900 hover:text-green-600"
                          >
                            Product
                            {sortConfig?.key === 'name' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left font-medium">
                          <button
                            onClick={() => requestSort('price')}
                            className="flex items-center text-gray-900 hover:text-green-600"
                          >
                            Price
                            {sortConfig?.key === 'price' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left font-medium">
                          <button
                            onClick={() => requestSort('category')}
                            className="flex items-center text-gray-900 hover:text-green-600"
                          >
                            Category
                            {sortConfig?.key === 'category' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left font-medium">
                          <button
                            onClick={() => requestSort('inventory')}
                            className="flex items-center text-gray-900 hover:text-green-600"
                          >
                            Stock
                            {sortConfig?.key === 'inventory' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-left font-medium">
                          <button
                            onClick={() => requestSort('isPublished')}
                            className="flex items-center text-gray-900 hover:text-green-600"
                          >
                            Status
                            {sortConfig?.key === 'isPublished' && (
                              <span className="ml-1">
                                {sortConfig.direction === 'ascending' ? '↑' : '↓'}
                              </span>
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-gray-900">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredAndSortedProducts.map((product) => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 w-12 h-12 mr-3">
                                <Image 
                                  src={getSafeImageUrl(product.images)} 
                                  alt={product.name}
                                  width={48}
                                  height={48}
                                  className="rounded-md object-cover w-12 h-12"
                                />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{product.name}</p>
                                <p className="text-xs text-gray-500">ID: {product.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            <span className="text-black">{formatPrice(product.price)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-medium ${
                              product.inventory < 10 ? "text-red-600" : "text-gray-900"
                            }`}>
                              {product.inventory} units
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              variant={product.isPublished ? "default" : "outline"}
                              size="sm"
                              onClick={() => togglePublished(product.id)}
                              disabled={isLoading}
                              className={`px-3 flex items-center ${
                                product.isPublished 
                                  ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" 
                                  : "bg-gray-100 text-gray-800 hover:bg-gray-200 border-gray-200"
                              }`}
                            >
                              {isLoading ? (
                                <FaSpinner className="animate-spin h-3 w-3 mr-1" />
                              ) : (
                                product.isPublished 
                                  ? <FaCheck className="mr-1 h-3 w-3" /> 
                                  : <FaTimes className="mr-1 h-3 w-3" />
                              )}
                              {product.isPublished ? "Published" : "Draft"}
                            </Button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <Link href={`/admin/products/${product.id}`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                >
                                  <FaEye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/products/${product.id}/edit`}>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50"
                                >
                                  <FaPencilAlt className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteProduct(product.id)}
                                disabled={isLoading}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                <FaTrash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaBoxOpen className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
                  <p className="mt-1 text-gray-500">
                    {searchQuery || filterCategory 
                      ? "Try clearing your filters or add a new product."
                      : "Start by adding your first product."}
                  </p>
                  <div className="mt-6">
                    <Link href="/admin/products/create">
                      <Button>Add New Product</Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination - We can implement real pagination later */}
      {filteredAndSortedProducts.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 rounded-lg shadow-sm">
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to{" "}
                <span className="font-medium">{filteredAndSortedProducts.length}</span> of{" "}
                <span className="font-medium">{filteredAndSortedProducts.length}</span> results
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <a
                  href="#"
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                </a>
                <a
                  href="#"
                  aria-current="page"
                  className="relative z-10 inline-flex items-center bg-green-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                  1
                </a>
                <a
                  href="#"
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </a>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 