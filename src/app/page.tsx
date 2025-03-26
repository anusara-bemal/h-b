"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatPrice, getSafeImageUrl } from "@/lib/utils";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaLeaf, FaTruck, FaClock, FaShieldAlt } from "react-icons/fa";
import { ProductCard } from "@/components/ui/product-card";
import { useSettings } from "@/context/settings-context";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string;
  category: {
    id: string;
    name: string;
  }
};

type Category = {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  image?: string;
};

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { settings, formatPrice } = useSettings();

  // Fetch featured products and categories
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      
      try {
        // Fetch featured products
        const productsResponse = await fetch("/api/products?featured=true");
        const productsData = await productsResponse.json();
        
        // Fetch categories
        const categoriesResponse = await fetch("/api/categories");
        const categoriesData = await categoriesResponse.json();
        
        setFeaturedProducts(productsData.slice(0, 4)); // Limit to 4 products
        setCategories(categoriesData.slice(0, 4)); // Limit to 4 categories
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <main>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-50 to-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Natural Solutions for{" "}
                <span className="text-green-600">Modern Living</span>
              </h1>
              <p className="mt-6 text-lg text-gray-600">
                Discover our premium selection of herbal products crafted from the 
                finest natural ingredients to enhance your health and wellbeing.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/products">
                  <Button size="lg" className="w-full sm:w-auto">
                    Shop Now
                  </Button>
                </Link>
                <Link href="/products">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Explore Categories
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative h-64 md:h-96"
            >
              <div className="absolute inset-0 bg-green-200 rounded-lg overflow-hidden">
                {/* Replace with your hero image */}
                <div className="w-full h-full bg-green-300 flex items-center justify-center text-green-700 text-lg">
                  Hero Image Placeholder
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Us</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              We pride ourselves on offering only the highest quality herbal products 
              with sustainable sourcing and rigorous testing.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-green-50 p-6 rounded-lg"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaLeaf size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">100% Natural</h3>
              <p className="mt-2 text-gray-600">
                All our products are made from natural ingredients without harmful chemicals.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-green-50 p-6 rounded-lg"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaTruck size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Free Shipping</h3>
              <p className="mt-2 text-gray-600">
                Enjoy free shipping on orders over {formatPrice(settings.shipping?.freeShippingThreshold || 5000)} across the country.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-green-50 p-6 rounded-lg"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaClock size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Secure Payment</h3>
              <p className="mt-2 text-gray-600">
                Our payment process is secure and we protect your personal information.
              </p>
            </motion.div>
            <motion.div
              whileHover={{ y: -10 }}
              className="bg-green-50 p-6 rounded-lg"
            >
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                <FaShieldAlt size={24} />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">24/7 Support</h3>
              <p className="mt-2 text-gray-600">
                Our customer service team is available around the clock to assist you.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <Link href="/products">
              <Button variant="outline">View All</Button>
            </Link>
          </div>
          
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <Card key={n} className="animate-pulse">
                  <div className="aspect-square w-full bg-gray-200"></div>
                  <CardContent>
                    <div className="h-5 bg-gray-200 rounded mt-2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="w-full"
                >
                  <Link href={`/products/${product.id}`} className="block h-full">
                    <ProductCard product={product} />
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No featured products available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Browse Categories</h2>
            <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
              Explore our wide range of herbal products sorted by categories
            </p>
          </div>
          
          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="relative rounded-lg overflow-hidden h-60 bg-gray-200 animate-pulse"></div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {categories.map((category) => (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Link href={`/products?category=${category.id}`}>
                    <div className="relative rounded-lg overflow-hidden h-60">
                      <div className="absolute inset-0 bg-gray-200">
                        {category.image ? (
                          <Image
                            src={getSafeImageUrl(category.image)}
                            alt={category.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-500">
                            {category.name}
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 p-4 text-white">
                        <h3 className="text-xl font-semibold">{category.name}</h3>
                        <p className="text-sm">{category.productCount} Products</p>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
              <p className="text-gray-500">No categories available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl font-bold">Subscribe to Our Newsletter</h2>
              <p className="mt-4">
                Get the latest news, promotions and updates from our team.
              </p>
            </div>
            <div>
              <form className="flex flex-col sm:flex-row gap-4">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="px-4 py-3 rounded-md flex-1 text-gray-900"
                />
                <Button
                  className="bg-white text-green-600 hover:bg-gray-100"
                >
                  Subscribe
                </Button>
              </form>
            </div>
          </div>
    </div>
      </section>
    </main>
  );
}
