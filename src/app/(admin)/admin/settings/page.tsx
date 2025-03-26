"use client";

import { useState, useEffect } from "react";
import { 
  FaShieldAlt, 
  FaBell, 
  FaEnvelope, 
  FaGlobe, 
  FaUsers, 
  FaShoppingBag, 
  FaSave,
  FaTruck,
  FaMoon,
  FaPalette,
  FaLanguage,
  FaMoneyBillWave,
  FaPlus,
  FaTrash,
  FaSpinner
} from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "react-hot-toast";

// Initial settings with simplified shipping
export const initialSettings = {
  general: {
    siteName: "Herbal Shop",
    siteDescription: "Premium quality herbal products",
    siteEmail: "info@herbalshop.com",
    supportPhone: "+94 77 123 4567",
    siteLogo: "/logo.png",
    favicon: "/favicon.ico",
    primaryColor: "#10b981",
    secondaryColor: "#f59e0b",
    address: "123 Green Avenue, Colombo 5, Sri Lanka",
  },
  shipping: {
    // Simplified shipping settings - just the essentials
    defaultShippingFee: 350,
    freeShippingThreshold: 10000
  },
  // Other settings remain unchanged
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(initialSettings);
  const [activeTab, setActiveTab] = useState("general");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch settings from the API when the component mounts
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/admin/settings');
        
        if (response.ok) {
          const data = await response.json();
          
          // If we have settings in the response, use them
          if (data && Object.keys(data).length > 0) {
            setSettings(data);
          }
        } else {
          // If response is not OK, show error message
          const errorData = await response.json();
          console.error('Failed to fetch settings:', errorData.error);
          toast.error('Failed to load settings');
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Could not load settings. Using defaults.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleGeneralChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      general: {
        ...settings.general,
        [name]: value,
      },
    });
  };

  const handleToggleChange = (section: string, setting: string, checked: boolean) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section as keyof typeof settings],
        [setting]: checked,
      },
    });
  };

  const handleNumberChange = (section: string, setting: string, value: string) => {
    const numValue = value === "" ? 0 : parseInt(value, 10);
    setSettings({
      ...settings,
      [section]: {
        ...settings[section as keyof typeof settings],
        [setting]: numValue,
      },
    });
  };

  // Update saveSettings function to save to the database
  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        const errorData = await response.json();
        console.error('Failed to save settings:', errorData.error);
        toast.error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state while fetching settings
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <FaSpinner className="animate-spin text-green-500 h-12 w-12 mb-4" />
          <h2 className="text-xl font-medium text-gray-700">Loading settings...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-700">Manage your store settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline"
            onClick={async () => {
              if (window.confirm('Reset all settings to default values? This cannot be undone.')) {
                try {
                  const response = await fetch('/api/admin/settings/defaults');
                  if (response.ok) {
                    const data = await response.json();
                    setSettings(data);
                    toast.success('Settings reset to defaults');
                  } else {
                    toast.error('Failed to reset settings');
                  }
                } catch (error) {
                  console.error('Error resetting settings:', error);
                  toast.error('Error resetting settings');
                }
              }
            }}
            className="px-4"
            disabled={isSaving}
          >
            Reset to Defaults
          </Button>
          <Button 
            onClick={saveSettings} 
            disabled={isSaving}
            className="px-6"
          >
            {isSaving ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-8 mb-8">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="layout">Layout</TabsTrigger>
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaGlobe className="mr-2 text-green-500" />
                General Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Basic information about your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="siteName">Site Name</Label>
                  <Input
                    id="siteName"
                    name="siteName"
                    value={settings.general.siteName}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Input
                    id="siteDescription"
                    name="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteEmail">Site Email</Label>
                  <Input
                    id="siteEmail"
                    name="siteEmail"
                    type="email"
                    value={settings.general.siteEmail}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone</Label>
                  <Input
                    id="supportPhone"
                    name="supportPhone"
                    value={settings.general.supportPhone}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={settings.general.address}
                    onChange={handleGeneralChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="text"
                      value={settings.general.primaryColor}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          general: {
                            ...settings.general,
                            primaryColor: e.target.value
                          }
                        });
                      }}
                    />
                    <input 
                      type="color" 
                      value={settings.general.primaryColor}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          general: {
                            ...settings.general,
                            primaryColor: e.target.value
                          }
                        });
                      }}
                      className="w-8 h-8 rounded"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaBell className="mr-2 text-green-500" />
                Notification Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Email Notifications</h3>
                  <p className="text-sm text-gray-700">Receive store notifications via email</p>
                </div>
                <Switch
                  checked={settings.notifications.emailNotifications}
                  onCheckedChange={(checked) => 
                    handleToggleChange("notifications", "emailNotifications", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Order Updates</h3>
                  <p className="text-sm text-gray-700">Get notified when orders are placed, updated or completed</p>
                </div>
                <Switch
                  checked={settings.notifications.orderUpdates}
                  onCheckedChange={(checked) => 
                    handleToggleChange("notifications", "orderUpdates", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Stock Alerts</h3>
                  <p className="text-sm text-gray-700">Get notified when products are running low on stock</p>
                </div>
                <Switch
                  checked={settings.notifications.stockAlerts}
                  onCheckedChange={(checked) => 
                    handleToggleChange("notifications", "stockAlerts", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">New Customer Alerts</h3>
                  <p className="text-sm text-gray-700">Get notified when new customers register</p>
                </div>
                <Switch
                  checked={settings.notifications.newCustomers}
                  onCheckedChange={(checked) => 
                    handleToggleChange("notifications", "newCustomers", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Marketing Emails</h3>
                  <p className="text-sm text-gray-700">Receive marketing tips and promotional ideas</p>
                </div>
                <Switch
                  checked={settings.notifications.marketingEmails}
                  onCheckedChange={(checked) => 
                    handleToggleChange("notifications", "marketingEmails", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaShieldAlt className="mr-2 text-green-500" />
                Security Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Manage security options for your admin account and store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-700">Require a code in addition to your password for increased security</p>
                </div>
                <Switch
                  checked={settings.security.twoFactorAuth}
                  onCheckedChange={(checked) => 
                    handleToggleChange("security", "twoFactorAuth", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Require Strong Passwords</h3>
                  <p className="text-sm text-gray-700">Force users to create stronger passwords with multiple character types</p>
                </div>
                <Switch
                  checked={settings.security.requireStrongPasswords}
                  onCheckedChange={(checked) => 
                    handleToggleChange("security", "requireStrongPasswords", checked)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  value={settings.security.sessionTimeout}
                  onChange={(e) => handleNumberChange("security", "sessionTimeout", e.target.value)}
                  min="15"
                  max="240"
                />
                <p className="text-sm text-gray-700">Time before users are automatically logged out due to inactivity</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleNumberChange("security", "maxLoginAttempts", e.target.value)}
                  min="3"
                  max="10"
                />
                <p className="text-sm text-gray-700">Number of failed login attempts before temporary account lockout</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Settings */}
        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaShoppingBag className="mr-2 text-green-500" />
                Product Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Configure how products are displayed and managed
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Out of Stock Products</h3>
                  <p className="text-sm text-gray-700">Display products that are currently out of stock</p>
                </div>
                <Switch
                  checked={settings.products.showOutOfStock}
                  onCheckedChange={(checked) => 
                    handleToggleChange("products", "showOutOfStock", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Product Reviews</h3>
                  <p className="text-sm text-gray-700">Allow customers to leave reviews on products</p>
                </div>
                <Switch
                  checked={settings.products.enableReviews}
                  onCheckedChange={(checked) => 
                    handleToggleChange("products", "enableReviews", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Moderate Reviews</h3>
                  <p className="text-sm text-gray-700">Review and approve customer reviews before they are published</p>
                </div>
                <Switch
                  checked={settings.products.moderateReviews}
                  onCheckedChange={(checked) => 
                    handleToggleChange("products", "moderateReviews", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Wishlist</h3>
                  <p className="text-sm text-gray-700">Allow customers to save products to a wishlist</p>
                </div>
                <Switch
                  checked={settings.products.enableWishlist}
                  onCheckedChange={(checked) => 
                    handleToggleChange("products", "enableWishlist", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Enable Product Comparisons</h3>
                  <p className="text-sm text-gray-700">Allow customers to compare multiple products</p>
                </div>
                <Switch
                  checked={settings.products.enableComparisons}
                  onCheckedChange={(checked) => 
                    handleToggleChange("products", "enableComparisons", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping & Tax Settings */}
        <TabsContent value="shipping">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaTruck className="mr-2 text-green-500" />
                Shipping Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Configure basic shipping options for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="freeShippingThreshold">Free Shipping Threshold (Rs)</Label>
                  <Input
                    id="freeShippingThreshold"
                    type="number"
                    value={settings.shipping.freeShippingThreshold}
                    onChange={(e) => handleNumberChange("shipping", "freeShippingThreshold", e.target.value)}
                    min="0"
                  />
                  <p className="text-sm text-gray-700">Order amount required for free shipping (0 to disable)</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultShippingFee">Default Shipping Fee (Rs)</Label>
                  <Input
                    id="defaultShippingFee"
                    type="number"
                    value={settings.shipping.defaultShippingFee}
                    onChange={(e) => handleNumberChange("shipping", "defaultShippingFee", e.target.value)}
                    min="0"
                  />
                  <p className="text-sm text-gray-700">Standard shipping fee for orders</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button
                onClick={saveSettings}
                disabled={isSaving || isLoading}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <FaSpinner className="mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" /> Save Shipping Settings
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Layout Settings */}
        <TabsContent value="layout">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaPalette className="mr-2 text-green-500" />
                Layout Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Customize the appearance and arrangement of your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <select
                    id="theme"
                    value={settings.layout.theme}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        layout: {
                          ...settings.layout,
                          theme: e.target.value
                        }
                      });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System Default</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="primaryColor"
                      type="text"
                      value={settings.layout.primaryColor}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          layout: {
                            ...settings.layout,
                            primaryColor: e.target.value
                          }
                        });
                      }}
                    />
                    <input 
                      type="color" 
                      value={settings.layout.primaryColor}
                      onChange={(e) => {
                        setSettings({
                          ...settings,
                          layout: {
                            ...settings.layout,
                            primaryColor: e.target.value
                          }
                        });
                      }}
                      className="w-8 h-8 rounded"
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="headerLayout">Header Layout</Label>
                  <select
                    id="headerLayout"
                    value={settings.layout.headerLayout}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        layout: {
                          ...settings.layout,
                          headerLayout: e.target.value
                        }
                      });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="centered">Centered</option>
                    <option value="sidebar">With Sidebar</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="footerLayout">Footer Layout</Label>
                  <select
                    id="footerLayout"
                    value={settings.layout.footerLayout}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        layout: {
                          ...settings.layout,
                          footerLayout: e.target.value
                        }
                      });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="detailed">Detailed</option>
                    <option value="columned">Multi-Column</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="productLayout">Product Display Layout</Label>
                  <select
                    id="productLayout"
                    value={settings.layout.productLayout}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        layout: {
                          ...settings.layout,
                          productLayout: e.target.value
                        }
                      });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="grid">Grid</option>
                    <option value="list">List</option>
                    <option value="compact">Compact</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="homepageLayout">Homepage Layout</Label>
                  <select
                    id="homepageLayout"
                    value={settings.layout.homepageLayout}
                    onChange={(e) => {
                      setSettings({
                        ...settings,
                        layout: {
                          ...settings.layout,
                          homepageLayout: e.target.value
                        }
                      });
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="featured">Featured Products</option>
                    <option value="categories">Category Focus</option>
                    <option value="slider">Large Slider</option>
                    <option value="minimal">Minimal</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sidebarPosition">Sidebar Position</Label>
                <select
                  id="sidebarPosition"
                  value={settings.layout.sidebarPosition}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      layout: {
                        ...settings.layout,
                        sidebarPosition: e.target.value
                      }
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                  <option value="none">None (Full Width)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show Recently Viewed</h3>
                    <p className="text-sm text-gray-700">Display recently viewed products section</p>
                  </div>
                  <Switch
                    checked={settings.layout.showRecentlyViewed}
                    onCheckedChange={(checked) => 
                      handleToggleChange("layout", "showRecentlyViewed", checked)
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Show Related Products</h3>
                    <p className="text-sm text-gray-700">Display related products on product pages</p>
                  </div>
                  <Switch
                    checked={settings.layout.showRelatedProducts}
                    onCheckedChange={(checked) => 
                      handleToggleChange("layout", "showRelatedProducts", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Currencies Settings */}
        <TabsContent value="currencies">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaMoneyBillWave className="mr-2 text-green-500" />
                Currency Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Configure currency options for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="activeCurrency">Default Currency</Label>
                <select
                  id="activeCurrency"
                  value={settings.currencies.active}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      currencies: {
                        ...settings.currencies,
                        active: e.target.value
                      },
                      general: {
                        ...settings.general,
                        currency: e.target.value
                      }
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {settings.currencies.available.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.name} ({currency.symbol})
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-700">Primary currency for your store</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Currency Selector</h3>
                  <p className="text-sm text-gray-700">Allow customers to change display currency</p>
                </div>
                <Switch
                  checked={settings.currencies.showCurrencySelector}
                  onCheckedChange={(checked) => 
                    handleToggleChange("currencies", "showCurrencySelector", checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto-Update Exchange Rates</h3>
                  <p className="text-sm text-gray-700">Automatically update currency exchange rates daily</p>
                </div>
                <Switch
                  checked={settings.currencies.updatePricesAutomatically}
                  onCheckedChange={(checked) => 
                    handleToggleChange("currencies", "updatePricesAutomatically", checked)
                  }
                />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Available Currencies</h3>
                <div className="space-y-4">
                  {settings.currencies.available.map((currency, index) => (
                    <div key={index} className="flex items-center space-x-4 border p-3 rounded-md bg-gray-50">
                      <div className="w-20">
                        <Input
                          value={currency.code}
                          onChange={(e) => {
                            const updatedCurrencies = [...settings.currencies.available];
                            updatedCurrencies[index].code = e.target.value;
                            setSettings({
                              ...settings,
                              currencies: {
                                ...settings.currencies,
                                available: updatedCurrencies
                              }
                            });
                          }}
                          placeholder="Code"
                        />
                      </div>
                      <div className="w-16">
                        <Input
                          value={currency.symbol}
                          onChange={(e) => {
                            const updatedCurrencies = [...settings.currencies.available];
                            updatedCurrencies[index].symbol = e.target.value;
                            setSettings({
                              ...settings,
                              currencies: {
                                ...settings.currencies,
                                available: updatedCurrencies
                              }
                            });
                          }}
                          placeholder="Symbol"
                        />
                      </div>
                      <div className="flex-grow">
                        <Input
                          value={currency.name}
                          onChange={(e) => {
                            const updatedCurrencies = [...settings.currencies.available];
                            updatedCurrencies[index].name = e.target.value;
                            setSettings({
                              ...settings,
                              currencies: {
                                ...settings.currencies,
                                available: updatedCurrencies
                              }
                            });
                          }}
                          placeholder="Name"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (settings.currencies.available.length <= 1) {
                            alert('You need at least one currency');
                            return;
                          }
                          
                          if (currency.code === settings.currencies.active) {
                            alert('Cannot remove active currency');
                            return;
                          }
                          
                          const updatedCurrencies = settings.currencies.available.filter((_, i) => i !== index);
                          setSettings({
                            ...settings,
                            currencies: {
                              ...settings.currencies,
                              available: updatedCurrencies
                            }
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        currencies: {
                          ...settings.currencies,
                          available: [
                            ...settings.currencies.available,
                            { code: "NEW", symbol: "¤", name: "New Currency" }
                          ]
                        }
                      });
                    }}
                  >
                    Add Currency
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Languages Settings */}
        <TabsContent value="languages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FaLanguage className="mr-2 text-green-500" />
                Language Settings
              </CardTitle>
              <CardDescription className="text-gray-700">
                Configure language options for your store
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="activeLanguage">Default Language</Label>
                <select
                  id="activeLanguage"
                  value={settings.languages.active}
                  onChange={(e) => {
                    setSettings({
                      ...settings,
                      languages: {
                        ...settings.languages,
                        active: e.target.value
                      },
                      general: {
                        ...settings.general,
                        language: e.target.value
                      }
                    });
                  }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {settings.languages.available.map((language) => (
                    <option key={language.code} value={language.code}>
                      {language.name}
                    </option>
                  ))}
                </select>
                <p className="text-sm text-gray-700">Primary language for your store</p>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Show Language Selector</h3>
                  <p className="text-sm text-gray-700">Allow customers to change display language</p>
                </div>
                <Switch
                  checked={settings.languages.showLanguageSelector}
                  onCheckedChange={(checked) => 
                    handleToggleChange("languages", "showLanguageSelector", checked)
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Translate Product Descriptions</h3>
                  <p className="text-sm text-gray-700">Automatically translate product descriptions when language changes</p>
                </div>
                <Switch
                  checked={settings.languages.translateProductDescriptions}
                  onCheckedChange={(checked) => 
                    handleToggleChange("languages", "translateProductDescriptions", checked)
                  }
                />
              </div>
              
              <div className="border-t pt-4">
                <h3 className="font-medium mb-4">Available Languages</h3>
                <div className="space-y-4">
                  {settings.languages.available.map((language, index) => (
                    <div key={index} className="flex items-center space-x-4 border p-3 rounded-md bg-gray-50">
                      <div className="w-20">
                        <Input
                          value={language.code}
                          onChange={(e) => {
                            const updatedLanguages = [...settings.languages.available];
                            updatedLanguages[index].code = e.target.value;
                            setSettings({
                              ...settings,
                              languages: {
                                ...settings.languages,
                                available: updatedLanguages
                              }
                            });
                          }}
                          placeholder="Code"
                        />
                      </div>
                      <div className="flex-grow">
                        <Input
                          value={language.name}
                          onChange={(e) => {
                            const updatedLanguages = [...settings.languages.available];
                            updatedLanguages[index].name = e.target.value;
                            setSettings({
                              ...settings,
                              languages: {
                                ...settings.languages,
                                available: updatedLanguages
                              }
                            });
                          }}
                          placeholder="Name"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => {
                          if (settings.languages.available.length <= 1) {
                            alert('You need at least one language');
                            return;
                          }
                          
                          if (language.code === settings.languages.active) {
                            alert('Cannot remove active language');
                            return;
                          }
                          
                          const updatedLanguages = settings.languages.available.filter((_, i) => i !== index);
                          setSettings({
                            ...settings,
                            languages: {
                              ...settings.languages,
                              available: updatedLanguages
                            }
                          });
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSettings({
                        ...settings,
                        languages: {
                          ...settings.languages,
                          available: [
                            ...settings.languages.available,
                            { code: "new", name: "New Language" }
                          ]
                        }
                      });
                    }}
                  >
                    Add Language
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 border-t pt-6 text-center">
        <p className="text-sm text-gray-600">
          Having trouble with your settings? Visit the{" "}
          <a href="/admin/settings/debug" className="text-green-600 hover:underline">
            Settings Debug Page
          </a>{" "}
          to view raw data.
        </p>
      </div>
    </div>
  );
} 