"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from 'next/link';
import { FaLeaf, FaShippingFast, FaCreditCard, FaArrowLeft, FaLock, FaShoppingCart, FaInfoCircle } from 'react-icons/fa';
import { useSettings } from '@/context/settings-context';
import { toast } from 'react-hot-toast';

type CartItem = {
  id: string;
  quantity: number;
  name?: string;
  price?: number;
  image?: string;
  product?: {
    id: string;
    name: string;
    price: number;
    salePrice?: number;
    images?: string;
  };
};

export default function CheckoutPage() {
  const router = useRouter();
  const { settings, formatPrice, getShippingSettings } = useSettings();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    paymentMethod: 'cash_on_delivery',
    notes: ''
  });
  const [shippingData, setShippingData] = useState(() => getShippingSettings());

  // Load cart data from localStorage but ALWAYS use settings for shipping
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First, update shipping data from settings
        setShippingData(getShippingSettings());
        console.log('Using shipping settings:', getShippingSettings());
        
        const storedCart = localStorage.getItem('cart');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          setCartItems(parsedCart.items || []);
          
          // IMPORTANT: Update localStorage with current settings to keep in sync
          const updatedCart = {
            items: parsedCart.items || [],
            shipping: getShippingSettings()
          };
          localStorage.setItem('cart', JSON.stringify(updatedCart));
          console.log('Updated cart in localStorage with current shipping settings');
        } else {
          setCartItems([]);
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCartItems([]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [settings.shipping]); // Depend on settings.shipping to reload when it changes

  // Ensure cartItems is always an array for calculations
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  
  // Calculate subtotal (sum of all items)
  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };
  
  // Calculate shipping fee based on subtotal - always use getShippingSettings()
  const getShippingFee = () => {
    const subtotal = calculateSubtotal();
    const shippingSettings = getShippingSettings();
    
    // If no items in cart, no shipping fee
    if (subtotal === 0) return 0;
    
    // Check for free shipping threshold first
    if (subtotal >= shippingSettings.freeThreshold) {
      return 0;
    }
    
    // Return the basic shipping fee
    return shippingSettings.fee;
  };
  
  const subtotal = calculateSubtotal();
  const shipping = getShippingFee();
  const total = subtotal + shipping;

  // Simpler validation - just check if we have items
  const hasValidCartData = safeCartItems.length > 0;

  // Create a resetCart function to easily clear problematic cart data
  const resetCart = () => {
    localStorage.removeItem('cart');
    setCartItems([]);
    router.push('/products');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRadioChange = (value: string) => {
    setFormData(prev => ({ ...prev, paymentMethod: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (safeCartItems.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare order data
      const orderData = {
        items: safeCartItems,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
          country: formData.country
        },
        shipping: {
          fee: shipping
        },
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
        subtotal,
        shipping,
        total
      };
      
      // Submit order to API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }
      
      const result = await response.json();
      
      // Clear cart
      localStorage.removeItem('cart');
      
      // Show success message
      toast.success('Order placed successfully! Thank you for your purchase.');
      
      // Redirect to order confirmation
      router.push(`/order-confirmation/${result.id}`);
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Display checkout UI
  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <Link href="/cart" className="text-green-600 hover:text-green-700 flex items-center">
            <FaArrowLeft className="mr-2" /> Back to Cart
          </Link>
        </div>
        
        {/* Cart errors display */}
        {cartError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <FaShoppingCart className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Cart Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{cartError}</p>
                </div>
                <div className="mt-4">
                  <div className="flex space-x-3">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={resetCart}
                    >
                      Reset Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => router.push('/cart')}
                    >
                      Review Cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Display empty cart message if needed */}
        {!cartError && safeCartItems.length === 0 && (
          <Card className="p-12 text-center mb-6">
            <div className="flex flex-col items-center">
              <FaShoppingCart className="h-16 w-16 text-gray-300 mb-6" />
              <h2 className="text-xl font-medium text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                You need to add some items to your cart before checking out.
                Browse our premium selection of herbal products.
              </p>
              <div className="flex space-x-4">
                <Button 
                  onClick={() => router.push('/products')}
                  className="px-8"
                >
                  Browse Products
                </Button>
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                >
                  Return to Home
                </Button>
              </div>
            </div>
          </Card>
        )}
        
        {safeCartItems.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Customer information */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  {/* Personal Information */}
                  <Card>
                    <CardHeader className="border-b">
                      <CardTitle className="flex items-center">
                        <FaLeaf className="mr-2 text-green-500" /> Personal Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">First Name *</Label>
                          <Input
                            id="firstName"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Last Name *</Label>
                          <Input
                            id="lastName"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number *</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Shipping Address */}
                  <Card>
                    <CardHeader className="border-b">
                      <CardTitle className="flex items-center">
                        <FaShippingFast className="mr-2 text-green-500" /> Shipping Address
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="street">Street Address *</Label>
                          <Input
                            id="street"
                            name="street"
                            value={formData.street}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="city">City *</Label>
                          <Input
                            id="city"
                            name="city"
                            value={formData.city}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="state">State/Province *</Label>
                          <Input
                            id="state"
                            name="state"
                            value={formData.state}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code *</Label>
                          <Input
                            id="postalCode"
                            name="postalCode"
                            value={formData.postalCode}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="country">Country *</Label>
                          <Input
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Shipping Options */}
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping</h3>
                    
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-green-50 p-3 border-b">
                        <div className="flex items-center text-green-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="font-medium">Standard Shipping</span>
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white">
                        <div className="flex justify-between items-center mb-3">
                          <div>
                            <p className="text-gray-700 font-medium">Delivery Time</p>
                            <p className="text-gray-500 text-sm">3-5 working days</p>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-700 font-medium">Cost</p>
                            <p className="text-gray-900">
                              {shipping === 0 ? (
                                <span className="text-green-600 font-medium">FREE</span>
                              ) : (
                                formatPrice(shippingData.fee)
                              )}
                            </p>
                          </div>
                        </div>
                        
                        {/* Free shipping progress bar */}
                        {calculateSubtotal() < getShippingSettings().freeThreshold ? (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Progress to free shipping</span>
                              <span className="text-gray-600">{Math.round((calculateSubtotal() / getShippingSettings().freeThreshold) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-green-500 h-2.5 rounded-full" 
                                style={{ width: `${Math.min(100, (calculateSubtotal() / getShippingSettings().freeThreshold) * 100)}%` }}
                              ></div>
                            </div>
                            <p className="text-sm text-green-600 mt-2">
                              Add {formatPrice(getShippingSettings().freeThreshold - calculateSubtotal())} more to qualify for free shipping!
                            </p>
                          </div>
                        ) : (
                          <div className="mt-3 bg-green-50 p-3 rounded-md flex items-center text-green-700">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-medium">Your order qualifies for FREE shipping!</span>
                          </div>
                        )}
                        
                        <div className="mt-4 text-xs text-gray-500">
                          Free shipping is available on all orders over {formatPrice(getShippingSettings().freeThreshold)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Payment Method */}
                  <Card>
                    <CardHeader className="border-b">
                      <CardTitle className="flex items-center">
                        <FaCreditCard className="mr-2 text-green-500" /> Payment Method
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <RadioGroup
                        value={formData.paymentMethod}
                        onValueChange={handleRadioChange}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50">
                          <RadioGroupItem value="cash_on_delivery" id="cash_on_delivery" />
                          <Label htmlFor="cash_on_delivery" className="cursor-pointer flex-1">
                            Cash on Delivery
                          </Label>
                        </div>
                        
                        <div className="flex items-center space-x-2 border rounded-md p-3 cursor-pointer hover:bg-gray-50">
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                          <Label htmlFor="bank_transfer" className="cursor-pointer flex-1">
                            Bank Transfer
                          </Label>
                        </div>
                      </RadioGroup>
                    </CardContent>
                  </Card>
                  
                  {/* Order Notes */}
                  <Card>
                    <CardHeader className="border-b">
                      <CardTitle>Order Notes (Optional)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        placeholder="Special instructions for delivery or anything else we should know"
                        className="h-24"
                      />
                    </CardContent>
                  </Card>
                </div>
              </form>
            </div>
            
            {/* Right Column - Order Summary */}
            <div>
              <Card className="mb-6">
                <CardHeader className="border-b">
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="divide-y">
                    {safeCartItems.map((item, index) => (
                      <div key={item.id || index} className="py-3 flex justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.name || 'Unknown Product'} 
                            <span className="text-gray-500 ml-1">
                              x{item.quantity}
                            </span>
                          </p>
                        </div>
                        <p className="font-medium text-gray-900">
                          {formatPrice((item.price || 0) * (item.quantity || 1))}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t mt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-900">{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">
                        {shipping === 0 ? "Free" : formatPrice(shipping)}
                      </span>
                    </div>
                    
                    <div className="border-t pt-4 flex justify-between">
                      <span className="text-gray-900 font-medium">Total</span>
                      <span className="font-bold text-lg text-gray-900">{formatPrice(total)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading || safeCartItems.length === 0}
                    onClick={handleSubmit}
                  >
                    {isLoading ? "Processing..." : "Place Order"}
                    {!isLoading && <FaLock className="ml-2 h-4 w-4" />}
                  </Button>
                </CardFooter>
              </Card>
              
              {debugMode && (
                <div className="mt-4 text-xs text-gray-500 bg-gray-100 p-4 rounded">
                  <details>
                    <summary className="cursor-pointer mb-2">Debug Cart Data</summary>
                    <pre className="whitespace-pre-wrap overflow-auto max-h-64">
                      {JSON.stringify(safeCartItems, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 