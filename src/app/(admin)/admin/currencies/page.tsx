"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { FaPlus, FaEdit, FaTrash, FaSave, FaRedo } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useSettings } from "@/context/settings-context";
import AdminHeader from "@/components/ui/admin-header";

type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number;
};

export default function CurrenciesPage() {
  const { settings, setSettings } = useSettings();
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [activeCurrency, setActiveCurrency] = useState<string>('USD');
  const [showCurrencySelector, setShowCurrencySelector] = useState(true);
  const [newCurrency, setNewCurrency] = useState<Currency>({
    code: '',
    symbol: '',
    name: '',
    rate: 1
  });
  const [loading, setLoading] = useState(false);

  // Initialize state from settings
  useEffect(() => {
    if (settings.currencies) {
      setCurrencies(settings.currencies.available || []);
      setActiveCurrency(settings.currencies.active || 'USD');
      setShowCurrencySelector(settings.currencies.showCurrencySelector || true);
    }
  }, [settings]);

  const handleAddCurrency = () => {
    // Validate new currency
    if (!newCurrency.code || !newCurrency.symbol || !newCurrency.name || newCurrency.rate <= 0) {
      toast.error('Please fill out all fields correctly');
      return;
    }

    // Check if code already exists
    if (currencies.some(c => c.code === newCurrency.code)) {
      toast.error('Currency code already exists');
      return;
    }

    // Add new currency
    const updatedCurrencies = [...currencies, newCurrency];
    setCurrencies(updatedCurrencies);
    
    // Reset form
    setNewCurrency({
      code: '',
      symbol: '',
      name: '',
      rate: 1
    });

    toast.success('Currency added successfully');
  };

  const handleRemoveCurrency = (code: string) => {
    // Don't allow removing base currency (USD)
    if (code === 'USD') {
      toast.error('Cannot remove base currency (USD)');
      return;
    }

    // Remove currency
    const updatedCurrencies = currencies.filter(c => c.code !== code);
    setCurrencies(updatedCurrencies);

    // If active currency is removed, set to USD
    if (activeCurrency === code) {
      setActiveCurrency('USD');
    }

    toast.success('Currency removed successfully');
  };

  const handleUpdateCurrency = (index: number, field: keyof Currency, value: string | number) => {
    const updatedCurrencies = [...currencies];
    
    // For USD, only allow updating name and symbol
    if (updatedCurrencies[index].code === 'USD' && field === 'rate') {
      toast.error('Cannot change the rate for the base currency (USD)');
      return;
    }

    updatedCurrencies[index] = {
      ...updatedCurrencies[index],
      [field]: field === 'rate' ? Number(value) : value
    };
    
    setCurrencies(updatedCurrencies);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      // Ensure USD exists with rate = 1
      if (!currencies.some(c => c.code === 'USD')) {
        setCurrencies([
          ...currencies,
          { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 }
        ]);
      } else {
        // Ensure USD has rate = 1
        const updatedCurrencies = currencies.map(c => 
          c.code === 'USD' ? { ...c, rate: 1 } : c
        );
        setCurrencies(updatedCurrencies);
      }

      // Update settings context
      const updatedSettings = {
        ...settings,
        currencies: {
          active: activeCurrency,
          available: currencies,
          showCurrencySelector,
          updatePricesAutomatically: true
        }
      };
      
      setSettings(updatedSettings);

      // Save to backend
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currencies: {
            active: activeCurrency,
            available: currencies,
            showCurrencySelector,
            updatePricesAutomatically: true
          }
        }),
      });

      if (response.ok) {
        toast.success('Currency settings saved successfully');
      } else {
        toast.error('Failed to save currency settings');
      }
    } catch (error) {
      console.error('Error saving currency settings:', error);
      toast.error('Error saving currency settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <AdminHeader 
        title="Currency Management" 
        description="Manage available currencies and exchange rates" 
      />

      <div className="grid grid-cols-1 gap-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Default Currency
                  </label>
                  <select
                    value={activeCurrency}
                    onChange={(e) => setActiveCurrency(e.target.value)}
                    className="w-full border-gray-300 rounded-md shadow-sm focus:border-green-500 focus:ring-green-500"
                  >
                    {currencies.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Show Currency Selector
                  </label>
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={showCurrencySelector}
                      onChange={() => setShowCurrencySelector(!showCurrencySelector)}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="ml-2">Allow customers to select currency</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Currencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exchange Rate (to USD)
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currencies.map((currency, index) => (
                    <tr key={currency.code} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {currency.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Input
                          value={currency.symbol}
                          onChange={(e) => handleUpdateCurrency(index, 'symbol', e.target.value)}
                          className="w-20"
                          disabled={loading}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Input
                          value={currency.name}
                          onChange={(e) => handleUpdateCurrency(index, 'name', e.target.value)}
                          className="w-full"
                          disabled={loading}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Input
                          type="number"
                          step="0.0001"
                          min={currency.code === 'USD' ? 1 : 0.0001}
                          value={currency.code === 'USD' ? 1 : currency.rate}
                          onChange={(e) => handleUpdateCurrency(index, 'rate', e.target.value)}
                          className="w-32"
                          disabled={currency.code === 'USD' || loading}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRemoveCurrency(currency.code)}
                          disabled={currency.code === 'USD' || loading}
                        >
                          <FaTrash className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add New Currency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency Code
                </label>
                <Input
                  value={newCurrency.code}
                  onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value.toUpperCase()})}
                  placeholder="USD"
                  maxLength={3}
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">3-letter ISO code</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Symbol
                </label>
                <Input
                  value={newCurrency.symbol}
                  onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})}
                  placeholder="$"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  value={newCurrency.name}
                  onChange={(e) => setNewCurrency({...newCurrency, name: e.target.value})}
                  placeholder="US Dollar"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange Rate
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={newCurrency.rate}
                  onChange={(e) => setNewCurrency({...newCurrency, rate: parseFloat(e.target.value)})}
                  placeholder="1.0"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">Rate to USD (1 USD = X)</p>
              </div>
            </div>
            <div className="mt-4">
              <Button
                onClick={handleAddCurrency}
                disabled={loading}
              >
                <FaPlus className="mr-2 h-4 w-4" /> Add Currency
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end mt-6">
          <Button
            onClick={saveSettings}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            <FaSave className="mr-2 h-4 w-4" /> Save Currency Settings
          </Button>
        </div>
      </div>
    </div>
  );
} 