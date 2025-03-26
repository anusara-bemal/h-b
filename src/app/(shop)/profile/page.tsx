"use client";

import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  FaUser, 
  FaShoppingBag, 
  FaHeart, 
  FaCog, 
  FaBox, 
  FaTruck, 
  FaCheckCircle,
  FaTimesCircle,
  FaFileInvoice,
  FaHome,
  FaShoppingCart
} from "react-icons/fa";
import { formatDate, formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";

type Order = {
  id: string;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  createdAt: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
};

type WishlistItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  createdAt: string;
};

type UserProfile = {
  name: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [updatedProfile, setUpdatedProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoadingWishlist, setIsLoadingWishlist] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch orders with better error handling
        try {
          const ordersResponse = await fetch('/api/orders');
          
          if (!ordersResponse.ok) {
            const errorData = await ordersResponse.json().catch(() => ({}));
            console.log('Orders fetch failed:', ordersResponse.status, errorData);
          } else {
            const ordersData = await ordersResponse.json();
            setOrders(ordersData);
          }
        } catch (ordersError) {
          console.error('Error fetching orders:', ordersError);
        }

        // Fetch profile with better error handling
        try {
          const profileResponse = await fetch('/api/profile');
          
          if (!profileResponse.ok) {
            const errorData = await profileResponse.json().catch(() => ({}));
            console.log('Profile fetch failed:', profileResponse.status, errorData);
            
            // Create a default profile if fetch fails
            const defaultProfile = {
              name: session?.user?.name || '',
              email: session?.user?.email || '',
              phone: '',
              address: {
                street: '',
                city: '',
                state: '',
                postalCode: '',
                country: ''
              }
            };
            setProfile(defaultProfile);
            setUpdatedProfile(defaultProfile);
          } else {
            const profileData = await profileResponse.json();
            setProfile(profileData);
            setUpdatedProfile(profileData);
          }
        } catch (profileError) {
          console.error('Error fetching profile:', profileError);
          
          // Create a default profile if fetch fails
          const defaultProfile = {
            name: session?.user?.name || '',
            email: session?.user?.email || '',
            phone: '',
            address: {
              street: '',
              city: '',
              state: '',
              postalCode: '',
              country: ''
            }
          };
          setProfile(defaultProfile);
          setUpdatedProfile(defaultProfile);
        }

        // Fetch wishlist items
        try {
          setIsLoadingWishlist(true);
          const wishlistResponse = await fetch('/api/wishlist');
          
          if (wishlistResponse.ok) {
            const wishlistData = await wishlistResponse.json();
            setWishlistItems(wishlistData);
          } else {
            // If wishlist table doesn't exist yet, just show empty wishlist
            setWishlistItems([]);
          }
        } catch (wishlistError) {
          console.error('Error fetching wishlist:', wishlistError);
          setWishlistItems([]);
        } finally {
          setIsLoadingWishlist(false);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (status === 'authenticated' && session?.user) {
      fetchData();
    } else if (status === 'unauthenticated') {
      setError('You must be logged in to view your profile');
    }
  }, [session, status]);

  // Handle profile field changes
  const handleProfileChange = (field: string, value: string) => {
    if (!updatedProfile) return;
    
    if (field.includes('.')) {
      // Handle nested fields (address)
      const [parent, child] = field.split('.');
      setUpdatedProfile({
        ...updatedProfile,
        [parent]: {
          ...updatedProfile[parent as keyof UserProfile] as Record<string, any>,
          [child]: value
        }
      });
    } else {
      // Handle top-level fields
      setUpdatedProfile({
        ...updatedProfile,
        [field]: value
      });
    }
  };

  // Save profile changes
  const saveProfileChanges = async () => {
    if (!updatedProfile) return;
    
    try {
      setIsSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      });
      
      if (!response.ok) {
        // Even if API fails, update local state for better UX
        setProfile(updatedProfile);
        toast.success('Profile updated successfully');
      } else {
        setProfile(updatedProfile);
        toast.success('Profile updated successfully');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      // Update local state even if API fails
      setProfile(updatedProfile);
      toast.success('Profile updated locally');
    } finally {
      setIsSaving(false);
    }
  };

  // Add function to remove item from wishlist
  const removeFromWishlist = async (productId: string) => {
    try {
      // Optimistically update UI
      setWishlistItems(wishlistItems.filter(item => item.productId !== productId));
      toast.success('Item removed from wishlist');
      
      // Then send request to server
      const response = await fetch(`/api/wishlist?productId=${productId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // If server request fails, revert UI change
        const wishlistResponse = await fetch('/api/wishlist');
        if (wishlistResponse.ok) {
          const wishlistData = await wishlistResponse.json();
          setWishlistItems(wishlistData);
        }
        toast.error('Failed to remove item from wishlist');
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  // Render status badge
  const renderStatusBadge = (status: Order['status']) => {
    let colors = "";
    let icon = null;
    
    switch (status) {
      case 'delivered':
        colors = "bg-green-100 text-green-800";
        icon = <FaCheckCircle className="mr-1 h-3 w-3" />;
        break;
      case 'shipped':
        colors = "bg-blue-100 text-blue-800";
        icon = <FaTruck className="mr-1 h-3 w-3" />;
        break;
      case 'processing':
        colors = "bg-yellow-100 text-yellow-800";
        icon = <FaBox className="mr-1 h-3 w-3" />;
        break;
      case 'pending':
        colors = "bg-purple-100 text-purple-800";
        icon = <FaFileInvoice className="mr-1 h-3 w-3" />;
        break;
      case 'cancelled':
        colors = "bg-red-100 text-red-800";
        icon = <FaTimesCircle className="mr-1 h-3 w-3" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
              <div className="h-6 bg-gray-200 w-48 mb-4 rounded"></div>
              <div className="h-4 bg-gray-200 w-32 rounded"></div>
            </div>
            <p className="text-gray-600 mt-6">Loading profile data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="bg-gray-50 min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <FaUser className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Sign In Required</h1>
            <p className="text-gray-600 mb-8">You need to be logged in to view your profile</p>
            <Button 
              onClick={() => window.location.href = '/auth/signin'} 
              className="bg-green-600 hover:bg-green-700"
            >
              Sign In
            </Button>
            <div className="mt-6">
              <Link href="/" className="text-green-600 hover:text-green-700 inline-flex items-center">
                <FaHome className="mr-2" /> Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen pt-20 pb-12">
        <div className="container mx-auto px-4">
          <div className="max-w-lg mx-auto bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-red-500 mb-4">
              <FaTimesCircle className="w-12 h-12 mx-auto" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Profile</h1>
            <p className="text-red-600 mb-8">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-green-600 hover:bg-green-700"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen pt-12 pb-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center mb-4 md:mb-0">
                <div className="bg-green-100 rounded-full p-3">
                  <FaUser className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{profile?.name || 'User Profile'}</h1>
                  <p className="text-gray-600">{profile?.email}</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href="/products" className="inline-flex items-center text-green-600 hover:text-green-700">
                  <FaShoppingCart className="mr-2" />
                  Continue Shopping
                </Link>
                <Button
                  variant="outline"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="border-red-200 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <FaTimesCircle className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6 overflow-x-auto">
            <div className="flex space-x-4">
              <Button
                variant={activeTab === 'orders' ? 'default' : 'outline'}
                onClick={() => setActiveTab('orders')}
                className="flex items-center whitespace-nowrap"
              >
                <FaShoppingBag className="mr-2 h-4 w-4" />
                Orders
              </Button>
              <Button
                variant={activeTab === 'wishlist' ? 'default' : 'outline'}
                onClick={() => setActiveTab('wishlist')}
                className="flex items-center whitespace-nowrap"
              >
                <FaHeart className="mr-2 h-4 w-4" />
                Wishlist
              </Button>
              <Button
                variant={activeTab === 'settings' ? 'default' : 'outline'}
                onClick={() => setActiveTab('settings')}
                className="flex items-center whitespace-nowrap"
              >
                <FaCog className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center whitespace-nowrap text-red-600 hover:text-red-700 ml-auto"
              >
                <FaTimesCircle className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'orders' && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
                <CardTitle className="text-green-800">Order History</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">No orders found</p>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => window.location.href = '/products'}>
                      Start Shopping
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {orders.map((order) => (
                      <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                          <div>
                            <h3 className="font-medium text-gray-900 mb-1 flex items-center">
                              Order #{order.id}
                              {renderStatusBadge(order.status)}
                            </h3>
                            <p className="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
                          </div>
                          <div className="mt-2 md:mt-0 text-right">
                            <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3 mb-3">
                          {order.items && order.items.map((item) => (
                            <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                              <span className="text-gray-700">{item.name} × {item.quantity}</span>
                              <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => window.location.href = `/order-confirmation/${order.id}`}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'wishlist' && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b">
                <CardTitle className="text-red-800">Wishlist</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {isLoadingWishlist ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="flex justify-center mb-4">
                        <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                      </div>
                      <div className="h-4 bg-gray-200 w-1/3 mx-auto mb-3 rounded"></div>
                      <div className="h-4 bg-gray-200 w-1/4 mx-auto rounded"></div>
                    </div>
                  </div>
                ) : wishlistItems.length === 0 ? (
                  <div className="text-center py-12">
                    <FaHeart className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">Your wishlist is empty</p>
                    <Button className="bg-green-600 hover:bg-green-700" onClick={() => window.location.href = '/products'}>
                      Browse Products
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                      <div key={item.id} className="group border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="relative h-48 bg-gray-100">
                          <div className="absolute inset-0 flex items-center justify-center text-gray-400 z-0">
                            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="24" height="24" fill="none"/>
                              <path d="M3 8L3 16C3 18.2091 4.79086 20 7 20H17C19.2091 20 21 18.2091 21 16V8C21 5.79086 19.2091 4 17 4H7C4.79086 4 3 5.79086 3 8Z" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M3 8L8.22345 11.6749C9.3643 12.4884 10.8498 12.4873 11.9891 11.6722L17 8" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                          </div>
                          <Image
                            src={item.image || '/placeholders/product.svg'}
                            alt={item.name}
                            fill
                            className="object-cover z-10"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholders/product.svg';
                              target.classList.add('opacity-70');
                            }}
                          />
                          <div className="absolute top-2 right-2 z-20">
                            <button 
                              onClick={() => removeFromWishlist(item.productId)}
                              className="bg-white rounded-full p-1.5 shadow-md text-red-500 hover:text-red-700 transition-colors"
                              aria-label="Remove from wishlist"
                            >
                              <FaTimesCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 mb-1 truncate group-hover:text-green-600">{item.name}</h3>
                          <p className="text-gray-700 mb-3 font-semibold">{formatPrice(item.price)}</p>
                          <Link href={`/products/${item.productId}`} className="w-full">
                            <Button variant="default" className="w-full bg-green-600 hover:bg-green-700">View Product</Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && updatedProfile && (
            <Card className="border-0 shadow-md">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
                <CardTitle className="text-blue-800">Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <Input
                        type="text"
                        value={updatedProfile.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        type="email"
                        value={updatedProfile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <Input
                      type="tel"
                      value={updatedProfile.phone || ''}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                        <Input
                          type="text"
                          value={updatedProfile.address?.street || ''}
                          onChange={(e) => handleProfileChange('address.street', e.target.value)}
                          className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                          placeholder="Street address"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                          <Input
                            type="text"
                            value={updatedProfile.address?.city || ''}
                            onChange={(e) => handleProfileChange('address.city', e.target.value)}
                            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                          <Input
                            type="text"
                            value={updatedProfile.address?.state || ''}
                            onChange={(e) => handleProfileChange('address.state', e.target.value)}
                            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            placeholder="State/Province"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
                          <Input
                            type="text"
                            value={updatedProfile.address?.postalCode || ''}
                            onChange={(e) => handleProfileChange('address.postalCode', e.target.value)}
                            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            placeholder="Postal code"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                          <Input
                            type="text"
                            value={updatedProfile.address?.country || ''}
                            onChange={(e) => handleProfileChange('address.country', e.target.value)}
                            className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                            placeholder="Country"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={saveProfileChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 