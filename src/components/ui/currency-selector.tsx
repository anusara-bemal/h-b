"use client";

import { useSettings } from "@/context/settings-context";
import { useState } from "react";
import { FaGlobe, FaChevronDown } from "react-icons/fa";

export function CurrencySelector() {
  const { settings, setActiveCurrency } = useSettings();
  const [isOpen, setIsOpen] = useState(false);
  
  // If currency selector is disabled in settings, don't show it
  if (!settings.currencies?.showCurrencySelector) {
    return null;
  }
  
  const activeCurrency = settings.currencies?.active || 'USD';
  const currencies = settings.currencies?.available || [];
  
  const handleSelect = (code: string) => {
    setActiveCurrency(code);
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      <button
        className="flex items-center space-x-1 text-sm cursor-pointer hover:text-primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <FaGlobe className="text-xs" />
        <span>{activeCurrency}</span>
        <FaChevronDown className="text-xs" />
      </button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 right-0 bg-card rounded-md shadow-lg overflow-hidden border border-border p-1 min-w-[120px]">
          <ul className="py-1">
            {currencies.map((currency) => (
              <li key={currency.code}>
                <button
                  className={`w-full text-left px-4 py-2 text-sm rounded-md ${
                    currency.code === activeCurrency 
                      ? 'bg-primary text-white' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => handleSelect(currency.code)}
                >
                  <span className="mr-2">{currency.symbol}</span>
                  {currency.code}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 