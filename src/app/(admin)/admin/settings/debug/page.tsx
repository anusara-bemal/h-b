"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FaSpinner, FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function SettingsDebugPage() {
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/admin/settings');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch settings');
        }
        
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        setError((error as Error).message || 'An unknown error occurred');
        console.error('Error fetching settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const refreshSettings = () => {
    setIsLoading(true);
    fetch('/api/admin/settings')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }
        return response.json();
      })
      .then(data => {
        setSettings(data);
        setError(null);
      })
      .catch(error => {
        setError((error as Error).message || 'An unknown error occurred');
        console.error('Error refreshing settings:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings Debug</h1>
          <p className="text-gray-700">View raw settings data from the database</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/settings">
            <Button variant="outline" className="flex items-center">
              <FaArrowLeft className="mr-2" />
              Back to Settings
            </Button>
          </Link>
          <Button onClick={refreshSettings} disabled={isLoading}>
            {isLoading ? (
              <FaSpinner className="animate-spin mr-2" />
            ) : null}
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-10">
          <FaSpinner className="animate-spin h-8 w-8 text-green-500" />
        </div>
      ) : settings && Object.keys(settings).length > 0 ? (
        <div className="grid grid-cols-1 gap-6">
          {Object.entries(settings).map(([category, data]) => (
            <Card key={category} className="overflow-hidden">
              <CardHeader className="bg-gray-50">
                <CardTitle className="text-lg font-medium">{category}</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No settings found in database</p>
        </div>
      )}
    </div>
  );
} 