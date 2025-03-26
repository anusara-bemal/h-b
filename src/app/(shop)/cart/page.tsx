"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSafeImageUrl } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaMinus, FaPlus, FaShoppingCart, FaTrash } from "react-icons/fa";
import { useSettings } from "@/context/settings-context";

type CartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    description: string;
    price: number;
    salePrice?: number;
    images: string;
    inventory: number;
  };
};

type Cart = {
  id: string;
  items: CartItem[];
};

export default function CartPage() {
  const router = useRouter();
  const { formatPrice, settings, getShippingSettings } = useSettings();
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  
  // Fetch cart data with forced settings update
  const fetchCart = async () => {
    setIsLoading(true);
    setError("");
    
    console.log("Fetching cart data...");
    
    try {
      const response = await fetch("/api/cart");
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cart fetch error data:", errorData);
        throw new Error(errorData.error || `Failed to fetch cart (status ${response.status})`);
      }
      
      const data = await response.json();
      console.log("Fetched cart data:", data);
      
      // Check if we have valid item IDs
      if (data.items && Array.isArray(data.items)) {
        console.log("Checking cart item IDs:", data.items.map(item => ({ id: item.id, productId: item.product?.id })));
        // Filter out any null items that might have come from the database
        data.items = data.items.filter(item => item && item.id && item.product);
      } else {
        console.warn("No items array or not an array:", data.items);
        data.items = [];
      }
      
      // Force a proper state update by creating a new object
      setCart({...data});
      
      // ALWAYS UPDATE LOCALSTORAGE WITH CURRENT SETTINGS - This is critical
      // Even if items are empty, ensure shipping settings are correct in localStorage
      const simplifiedItems = data.items && data.items.length > 0 
        ? data.items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            name: item.product.name,
            price: item.product.salePrice || item.product.price,
            image: item.product.images
          }))
        : [];
      
      // Always use the freshest settings values from context
      const shippingSettings = getShippingSettings();
      const cartData = {
        items: simplifiedItems,
        shipping: shippingSettings
      };
      
      localStorage.setItem('cart', JSON.stringify(cartData));
      console.log('Forced update of cart data in localStorage with current settings:', cartData);
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError(`Failed to load your cart: ${error instanceof Error ? error.message : String(error)}`);
      // Initialize an empty cart to avoid null references
      setCart({ id: "", items: [] });
      
      // Even on error, try to update localStorage with fresh settings
      try {
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          const cartData = {
            items: parsedCart.items || [],
            shipping: getShippingSettings()
          };
          localStorage.setItem('cart', JSON.stringify(cartData));
          console.log('Updated localStorage with fresh settings even after cart fetch error');
        }
      } catch (e) {
        console.error("Failed to update localStorage after cart error:", e);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchCart();
  }, []);
  
  // Update item quantity
  const updateQuantity = async (itemId: string, newQuantity: number) => {
    try {
      setIsUpdating(true);
      setError("");
      
      console.log(`Updating quantity for item ID: ${itemId} to ${newQuantity}`);
      
      // Make sure we have valid values
      if (!itemId) {
        console.error("Missing itemId:", itemId);
        setError("Item ID is missing");
        setIsUpdating(false);
        return;
      }
      
      if (newQuantity < 1) {
        console.error("Invalid quantity:", newQuantity);
        setError("Quantity must be at least 1");
        setIsUpdating(false);
        return;
      }

      // Send update request to API
      const response = await fetch('/api/cart/direct-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          quantity: newQuantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        setError(errorData.error || "Failed to update cart");
        setIsUpdating(false);
        return;
      }

      const result = await response.json();
      console.log("Update result:", result);
      
      if (!result.success) {
        console.error("API returned success: false", result);
        setError(result.error || "Update failed");
        setIsUpdating(false);
        return;
      }
      
      // Refresh the cart
      await fetchCart();
      setIsUpdating(false);
    } catch (error) {
      console.error("Error updating quantity:", error);
      setError("An unexpected error occurred");
      setIsUpdating(false);
    }
  };
  
  // Remove item from cart
  const removeItem = async (itemId: string) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setError("");
    
    console.log(`Removing item ${itemId} from cart`);
    
    try {
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: "DELETE",
      });
      
      // Handle error responses with more detail
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Cart remove error data:", errorData);
        throw new Error(errorData.error || `Failed to remove item (status ${response.status})`);
      }
      
      const updatedCart = await response.json();
      console.log("Item removed, new cart:", updatedCart);
      
      // Make sure the items array is properly initialized
      if (!updatedCart.items) {
        updatedCart.items = [];
      }
      
      // Force a proper state update by creating a new object
      setCart({...updatedCart});
      
      // Check if we need to reload the page (e.g., cart is now empty)
      if (!updatedCart.items || updatedCart.items.length === 0) {
        window.location.reload();
        return;
      }
    } catch (error) {
      console.error("Error removing item:", error);
      setError(`Failed to remove item: ${error instanceof Error ? error.message : String(error)}`);
      
      // Refresh cart data as fallback
      fetchCart();
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Clear cart and localStorage
  const clearCart = async () => {
    if (isUpdating || !cart?.items.length) return;
    
    if (!window.confirm("Are you sure you want to clear your cart?")) return;
    
    // Clear localStorage first to ensure complete refresh
    localStorage.removeItem('cart');
    
    setIsUpdating(true);
    setError("");
    
    try {
      const response = await fetch("/api/cart", {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to clear cart");
      }
      
      const updatedCart = await response.json();
      console.log("Cart cleared successfully:", updatedCart);
      setCart(updatedCart);
      
      // Refresh the page to ensure everything is reset
      window.location.reload();
    } catch (error) {
      console.error("Error clearing cart:", error);
      setError("Failed to clear your cart: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Calculate cart subtotal
  const calculateSubtotal = () => {
    if (!cart?.items || !Array.isArray(cart.items)) return 0;
    
    return cart.items.reduce((total, item) => {
      if (!item.product) return total;
      
      const price = item.product.salePrice ?? item.product.price;
      return total + price * item.quantity;
    }, 0);
  };
  
  // Calculate shipping cost - simplified version
  const calculateShipping = (subtotal: number) => {
    const shippingSettings = getShippingSettings();
    
    // If subtotal exceeds free shipping threshold, shipping is free
    if (shippingSettings.freeThreshold && subtotal >= shippingSettings.freeThreshold) {
      return 0;
    }
    
    // Otherwise use default shipping fee
    return shippingSettings.fee;
  };
  
  // Calculate order total
  const calculateTotal = (subtotal: number, shipping: number) => {
    return subtotal + shipping;
  };
  
  // Calculate cart totals
  const subtotal = calculateSubtotal();
  const shipping = calculateShipping(subtotal);
  const total = calculateTotal(subtotal, shipping);
  
  // Recalculate when settings change
  useEffect(() => {
    // Force a re-render when shipping settings change
    console.log('Shipping settings changed, recalculating...');
    // No need to do anything - the render will recalculate based on new settings
  }, [settings.shipping?.freeShippingThreshold, settings.shipping?.defaultShippingFee]);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Your Cart</h1>
          <div className="animate-pulse">
            <div className="h-20 bg-gray-200 rounded mb-6"></div>
            <div className="h-20 bg-gray-200 rounded mb-6"></div>
            <div className="h-20 bg-gray-200 rounded mb-6"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Cart</h1>
          <Link href="/products" className="text-green-600 hover:text-green-700 flex items-center">
            <FaArrowLeft className="mr-2" /> Continue Shopping
          </Link>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}
        
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="border-b">
                  <h3 className="text-lg font-medium">
                    Items in your cart ({cart.items.length})
                  </h3>
                </CardHeader>
                <CardContent>
                  <AnimatePresence>
                    {cart.items.map((item) => {
                      if (!item || !item.product) return null;
                      
                      const price = item.product.salePrice ?? item.product.price;
              
              return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="py-6 first:pt-0 border-b last:border-0"
                        >
                          <div className="flex items-center">
                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                        <Image
                                src={getSafeImageUrl(item.product.images)}
                                alt={item.product.name}
                                width={96}
                                height={96}
                                className="h-full w-full object-cover object-center"
                              />
                    </div>
                    
                            <div className="ml-4 flex-1">
                      <div className="flex justify-between">
                                <h3 className="text-base font-medium text-gray-900">
                                  <Link href={`/products/${item.product.id}`} className="hover:underline">
                                    {item.product.name}
                        </Link>
                                </h3>
                                <p className="ml-4 text-base font-medium text-gray-900">
                                  {formatPrice(price * item.quantity)}
                                </p>
                      </div>
                      
                              <p className="mt-1 text-sm text-gray-500 line-clamp-1">
                                {formatPrice(price)} each
                              </p>
                              
                              <div className="mt-4 flex justify-between">
                                <div className="flex items-center">
                                  <Button
                                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            disabled={isUpdating || item.quantity <= 1}
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <FaMinus className="h-3 w-3" />
                                  </Button>
                                  
                                  <span className="mx-3 w-8 text-center">
                            {item.quantity}
                          </span>
                                  
                                  <Button
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    disabled={isUpdating || item.quantity >= item.product.inventory}
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                  >
                                    <FaPlus className="h-3 w-3" />
                                  </Button>
                                </div>
                                
                                <Button
                                  onClick={() => removeItem(item.id)}
                                  disabled={isUpdating}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <FaTrash className="h-4 w-4" />
                                </Button>
                        </div>
                      </div>
                    </div>
                        </motion.div>
              );
            })}
                  </AnimatePresence>
                </CardContent>
                <CardFooter className="flex justify-between border-t pt-6">
                  <Button 
                    onClick={clearCart}
                    disabled={isUpdating || !cart.items.length}
                    variant="outline"
                  >
                    Clear Cart
                  </Button>
                </CardFooter>
              </Card>
          </div>
          
          <div>
            <Card>
                <CardHeader className="border-b">
                  <h3 className="text-lg font-medium">Order Summary</h3>
              </CardHeader>
                <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                  </div>
                    
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">
                        {shipping === 0 ? (
                          <span className="text-green-600 font-medium">Free</span>
                        ) : formatPrice(shipping)}
                    </span>
                  </div>
                    
                    {/* Free shipping threshold info styled nicely */}
                    <div className="rounded-md bg-gray-50 p-3 text-sm">
                      {subtotal >= getShippingSettings().freeThreshold ? (
                        <div className="flex items-center text-green-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Your order qualifies for FREE shipping!</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-gray-700 mb-2">
                            Free shipping on orders over {formatPrice(getShippingSettings().freeThreshold)}
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (subtotal / getShippingSettings().freeThreshold) * 100)}%` }}></div>
                          </div>
                          <div className="text-sm text-green-600 mt-2">
                            Add {formatPrice(getShippingSettings().freeThreshold - subtotal)} more to qualify for free shipping
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="border-t pt-4 flex justify-between">
                      <span className="text-gray-900 font-medium">Total</span>
                      <span className="font-bold text-lg text-gray-900">{formatPrice(total)}</span>
                    </div>
                </div>
              </CardContent>
              <CardFooter>
                  <Button 
                    onClick={() => router.push('/checkout')}
                    className="w-full"
                  >
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
        ) : (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center">
              <FaShoppingCart className="h-16 w-16 text-gray-300 mb-6" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Looks like you haven't added any items to your cart yet. 
                Explore our premium herbal products and find something you'll love!
              </p>
              <div className="flex space-x-4">
                <Button 
                  onClick={() => router.push('/products')}
                  className="px-8"
                >
                  Browse Products
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => router.push('/')} 
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 