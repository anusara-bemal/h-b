"use client";

import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSafeImageUrl } from "@/lib/utils";
import { FaArrowLeft, FaEdit, FaTrashAlt } from "react-icons/fa";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "react-hot-toast";

export default function ProductDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch product data
  useEffect(() => {
    async function fetchProduct() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/products/${params.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch product");
        }
        
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        setError("Error loading product. Please try again.");
        toast.error("Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    }

    fetchProduct();
  }, [params.id]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/products/${params.id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete product");
      }
      
      toast.success("Product deleted successfully");
      router.push("/admin/products");
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Failed to delete product");
    }
  };

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 border-t-4 border-green-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading product data...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="bg-gray-50 min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
          </div>
          <Card>
            <CardContent className="p-6">
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-red-600 mb-4">{error || "Product not found"}</p>
                  <Button onClick={() => router.back()}>Go Back</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-900"
            >
              <FaArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Product Details</h1>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/products/${params.id}/edit`)}
            >
              <FaEdit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <FaTrashAlt className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h2>
                <div className="mb-4">
                  <span className="bg-gray-200 text-gray-800 px-2 py-1 rounded text-sm">
                    {product.category?.name || "No Category"}
                  </span>
                  {product.isFeatured && (
                    <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded text-sm ml-2">
                      Featured
                    </span>
                  )}
                  {!product.isPublished && (
                    <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-sm ml-2">
                      Not Published
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    {product.salePrice ? (
                      <>
                        <span className="text-2xl font-bold text-red-600">
                          ${Number(product.salePrice).toFixed(2)}
                        </span>
                        <span className="text-lg text-gray-500 line-through">
                          ${Number(product.price).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-gray-900">
                        ${Number(product.price).toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500">Inventory: {product.inventory} units</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-gray-700">{product.description}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Product Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {product.images ? (() => {
                    let imageArray = [];
                    try {
                      if (typeof product.images === 'string') {
                        // Try to parse JSON if it looks like JSON
                        if (product.images.trim().startsWith('[')) {
                          imageArray = JSON.parse(product.images);
                        } else {
                          // If it's a single image URL or comma-separated list
                          imageArray = product.images.split(',').map(url => url.trim()).filter(Boolean);
                        }
                      } else if (Array.isArray(product.images)) {
                        imageArray = product.images;
                      }
                    } catch (e) {
                      // If parsing fails, treat it as a single image
                      imageArray = [product.images];
                    }

                    return Array.isArray(imageArray) && imageArray.length > 0 ? 
                      imageArray.map((image, index) => (
                        <div key={index} className="relative">
                          <Image
                            src={getSafeImageUrl(image)}
                            alt={`${product.name} - Image ${index + 1}`}
                            width={200}
                            height={200}
                            className="rounded-lg object-cover w-full h-48"
                          />
                        </div>
                      )) : 
                      <div className="relative">
                        <Image
                          src={getSafeImageUrl(product.images)}
                          alt={product.name}
                          width={200}
                          height={200}
                          className="rounded-lg object-cover w-full h-48"
                        />
                      </div>;
                  })() : 
                  <div className="text-gray-500 p-4 border rounded-lg">No images available</div>
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 