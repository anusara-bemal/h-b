"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getSafeImageUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { FaArrowLeft, FaCartPlus, FaMinus, FaPlus, FaHeart } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useSession } from "next-auth/react";
import { useSettings } from "@/context/settings-context";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  images: string;
  inventory: number;
  isFeatured: boolean;
  isPublished: boolean;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

// Helper function to process images
const getImageUrls = (imagesString: string): string[] => {
  // Try to get at least one valid image
  const firstImage = getSafeImageUrl(imagesString);
  
  // If we found a valid image (not a placeholder), try to get more
  if (!firstImage.includes('placehold.co')) {
    try {
      // Try to parse as JSON
      const images = JSON.parse(imagesString);
      if (Array.isArray(images)) {
        // Filter to only valid URLs
        return images.filter(url => 
          typeof url === 'string' && 
          (url.startsWith('http') || url.startsWith('/')) && 
          !url.includes('google.com/imgres?')
        );
      }
      
      // If it's not an array, but we have a valid image, return just that
      return [firstImage];
    } catch (e) {
      // If JSON parsing fails but we have a comma-separated string
      if (typeof imagesString === 'string' && imagesString.includes(',')) {
        return imagesString
          .split(',')
          .map(url => url.trim())
          .filter(url => 
            url && 
            (url.startsWith('http') || url.startsWith('/')) && 
            !url.includes('google.com/imgres?')
          );
      }
      
      // Fallback to just the first valid image we found
      return [firstImage];
    }
  }
  
  // If no valid images found
  return [];
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { formatPrice } = useSettings();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [error, setError] = useState("");
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isAddingToWishlist, setIsAddingToWishlist] = useState(false);
  const { data: session } = useSession();
  
  // Fetch product details
  useEffect(() => {
    async function fetchProduct() {
      setIsLoading(true);
      setError("");
      
      try {
        console.log(`Fetching product with ID: ${id}, type: ${typeof id}`);
        
        const response = await fetch(`/api/products/${id}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Product not found");
          } else {
            setError("Failed to load product");
          }
          return;
        }
        
        const data = await response.json();
        console.log("Product data received:", {
          id: data.id,
          idType: typeof data.id,
          name: data.name
        });
        
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("An error occurred while loading the product");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (id) {
      fetchProduct();
    }
  }, [id]);
  
  // Handle quantity changes
  const increaseQuantity = () => {
    if (product && quantity < product.inventory) {
      setQuantity(quantity + 1);
    }
  };
  
  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };
  
  // Add to cart
  const addToCart = async () => {
    if (!product) return;
    
    setIsAddingToCart(true);
    
    try {
      // Make sure productId is properly formatted
      const productId = typeof product.id === 'string' ? parseInt(product.id, 10) : product.id;
      
      console.log("Adding to cart:", { 
        productId, 
        originalId: product.id,
        idType: typeof product.id, 
        quantity 
      });
      
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          quantity,
        }),
      });
      
      // Attempt to parse the response even if it's an error
      let responseData;
      try {
        responseData = await response.json();
      } catch (e) {
        responseData = { error: "Failed to parse response" };
      }
      
      if (!response.ok) {
        console.error("Error response:", responseData);
        throw new Error(responseData.error || "Failed to add to cart");
      }
      
      toast.success(`${product.name} added to cart`);
      
      // Navigate to cart page on success
      router.push("/cart");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add product to cart");
      setError(error instanceof Error ? error.message : "Failed to add product to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };
  
  // Check if product is in wishlist
  useEffect(() => {
    // Only check wishlist if user is logged in
    if (session?.user && product?.id) {
      checkIfInWishlist();
    }
  }, [session, product]);
  
  // Check if product is in wishlist
  const checkIfInWishlist = async () => {
    try {
      const response = await fetch('/api/wishlist');
      if (response.ok) {
        const items = await response.json();
        const isInList = items.some((item: any) => item.productId === product.id);
        setIsInWishlist(isInList);
      }
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };
  
  // Toggle wishlist
  const toggleWishlist = async () => {
    if (!session?.user) {
      toast.error('Please sign in to add items to your wishlist');
      return;
    }
    
    try {
      setIsAddingToWishlist(true);
      
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?productId=${product.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsInWishlist(false);
          toast.success('Removed from wishlist');
        } else {
          throw new Error('Failed to remove from wishlist');
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId: product.id }),
        });
        
        if (response.ok) {
          setIsInWishlist(true);
          toast.success('Added to wishlist');
        } else {
          throw new Error('Failed to add to wishlist');
        }
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setIsAddingToWishlist(false);
    }
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 w-3/4"></div>
                <div className="h-6 bg-gray-200 w-1/4"></div>
                <div className="h-4 bg-gray-200 w-full mt-4"></div>
                <div className="h-4 bg-gray-200 w-full"></div>
                <div className="h-4 bg-gray-200 w-3/4"></div>
                <div className="h-12 bg-gray-200 w-full mt-8"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/products" className="inline-flex items-center text-green-600 hover:text-green-700 mb-8">
            <FaArrowLeft className="mr-2" /> Back to products
          </Link>
          
          <Card className="p-12 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{error}</h1>
            <p className="text-gray-600 mb-8">
              The product you are looking for might have been removed or is temporarily unavailable.
            </p>
            <Button onClick={() => router.push("/products")}>
              Browse Products
            </Button>
          </Card>
        </div>
      </div>
    );
  }
  
  // Render product details
  if (!product) return null;
  
  const imageUrls = getImageUrls(product.images);
  const displayPrice = product.salePrice ?? product.price;
  const isOnSale = product.salePrice !== null && product.salePrice < product.price;
  
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link href="/products" className="inline-flex items-center text-green-600 hover:text-green-700 mb-8">
          <FaArrowLeft className="mr-2" /> Back to products
        </Link>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            {imageUrls.length > 0 ? (
              <div className="aspect-square relative">
                <Image
                  src={imageUrls[0]}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="aspect-square flex items-center justify-center bg-gray-100 text-gray-400">
                No image available
              </div>
            )}
          </div>
          
          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
            
            <div className="mt-2">
              <Link href={`/categories/${product.category.slug}`}>
                <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                  {product.category.name}
                </span>
              </Link>
            </div>
            
            <div className="mt-6">
              {isOnSale ? (
                <div className="flex items-center">
                  <span className="text-3xl font-bold text-green-600">
                    {formatPrice(displayPrice)}
                  </span>
                  <span className="ml-2 text-lg text-gray-500 line-through">
                    {formatPrice(product.price)}
                  </span>
                  <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    SALE
                  </span>
                </div>
              ) : (
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(product.price)}
                </span>
              )}
            </div>
            
            <div className="mt-6">
              <p className="text-gray-700 text-lg leading-relaxed whitespace-pre-line">
                {product.description}
              </p>
            </div>
            
            {product.inventory > 0 ? (
              <>
                <div className="mt-8">
                  <h3 className="text-sm font-medium text-gray-900">Quantity</h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <Button 
                      onClick={decreaseQuantity}
                      variant="outline"
                      size="icon"
                      disabled={quantity <= 1}
                    >
                      <FaMinus className="h-3 w-3" />
                    </Button>
                    <span className="w-12 text-center font-medium">{quantity}</span>
                    <Button 
                      onClick={increaseQuantity}
                      variant="outline"
                      size="icon"
                      disabled={quantity >= product.inventory}
                    >
                      <FaPlus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm text-gray-500 ml-2">
                      {product.inventory} available
                    </span>
                  </div>
                </div>
                
                <div className="mt-8 flex space-x-4">
                  <Button 
                    onClick={addToCart} 
                    className="flex-1 flex items-center justify-center py-3"
                    disabled={isAddingToCart}
                  >
                    <FaCartPlus className="mr-2 h-5 w-5" />
                    {isAddingToCart ? 'Adding...' : 'Add to Cart'}
                  </Button>
                  
                  <Button 
                    onClick={toggleWishlist}
                    variant={isInWishlist ? "destructive" : "outline"}
                    className="px-4"
                    disabled={isAddingToWishlist}
                  >
                    <FaHeart className={`h-5 w-5 ${isInWishlist ? 'text-white' : 'text-red-500'}`} />
                  </Button>
                </div>
              </>
            ) : (
              <div className="mt-8">
                <p className="text-red-600 font-medium">Out of stock</p>
                <Button 
                  variant="outline" 
                  className="mt-4 w-full"
                  onClick={toggleWishlist}
                  disabled={isAddingToWishlist}
                >
                  <FaHeart className="mr-2 h-5 w-5" />
                  {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}