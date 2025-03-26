"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductFormData } from "@/types";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { FaArrowLeft, FaSave, FaSpinner, FaUpload, FaTimesCircle } from "react-icons/fa";
import Image from "next/image";

type Category = {
  id: string;
  name: string;
  slug: string;
};

export default function CreateProduct() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingCategories, setFetchingCategories] = useState(true);
  const [formData, setFormData] = useState<ProductFormData>({
    name: "",
    description: "",
    price: 0,
    salePrice: undefined,
    inventory: 0,
    categoryId: "",
    images: "",
    isFeatured: false,
    isPublished: true,
  });
  
  // New states for image upload
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setFetchingCategories(true);
      try {
        const response = await fetch('/api/admin/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setFetchingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Product name is required";
    }
    
    if (!formData.description.trim()) {
      newErrors.description = "Product description is required";
    }
    
    if (formData.price <= 0) {
      newErrors.price = "Price must be greater than zero";
    }
    
    if (formData.salePrice !== undefined && formData.salePrice >= formData.price) {
      newErrors.salePrice = "Sale price must be less than regular price";
    }
    
    if (formData.inventory < 0) {
      newErrors.inventory = "Inventory cannot be negative";
    }
    
    if (!formData.categoryId) {
      newErrors.categoryId = "Please select a category";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // New function to handle file selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      
      // Create preview URLs
      const newPreviewUrls = filesArray.map(file => URL.createObjectURL(file));
      
      setSelectedImages(prev => [...prev, ...filesArray]);
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
      
      // Clear the file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Function to remove a selected image
  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  // Modify the handleSubmit function to handle image uploads
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create slug from name
      const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      
      // Create FormData for multipart form submission
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('price', formData.price.toString());
      if (formData.salePrice !== undefined) {
        formDataToSend.append('salePrice', formData.salePrice.toString());
      }
      formDataToSend.append('inventory', formData.inventory.toString());
      formDataToSend.append('categoryId', formData.categoryId);
      formDataToSend.append('isFeatured', formData.isFeatured.toString());
      formDataToSend.append('isPublished', formData.isPublished.toString());
      formDataToSend.append('slug', slug);
      
      // Add images if any are selected
      selectedImages.forEach(image => {
        formDataToSend.append('images', image);
      });
      
      // If no images selected, use the URLs from text input (backward compatibility)
      if (selectedImages.length === 0 && formData.images) {
        formDataToSend.append('imageUrls', formData.images);
      }
      
      // Send data to API
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        body: formDataToSend, // No Content-Type header for FormData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }
      
      // Redirect to products list on success
      router.push("/admin/products");
    } catch (error) {
      console.error("Error creating product:", error);
      setErrors(prev => ({
        ...prev,
        form: (error as Error).message || 'Failed to create product'
      }));
    } finally {
      setIsLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Create New Product</h1>
        </div>

        {errors.form && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{errors.form}</p>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <label 
                      htmlFor="name" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      error={errors.name}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="description" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Description *
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                      className={`w-full rounded-md border ${
                        errors.description ? "border-red-500" : "border-gray-300"
                      } bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2`}
                    />
                    {errors.description && (
                      <p className="mt-1 text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>

                  <div>
                    <label 
                      htmlFor="categoryId" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Category *
                    </label>
                    {fetchingCategories ? (
                      <div className="flex items-center text-sm text-gray-500">
                        <FaSpinner className="animate-spin mr-2" /> Loading categories...
                      </div>
                    ) : (
                      <>
                        <select
                          id="categoryId"
                          name="categoryId"
                          value={formData.categoryId}
                          onChange={handleChange}
                          className={`w-full h-10 rounded-md border ${
                            errors.categoryId ? "border-red-500" : "border-gray-300"
                          } bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2`}
                        >
                          <option value="">Select a category</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        {errors.categoryId && (
                          <p className="mt-1 text-sm text-red-500">{errors.categoryId}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Price & Inventory */}
                <div className="space-y-6">
                  <div>
                    <label 
                      htmlFor="price" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Price ($) *
                    </label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      error={errors.price}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="salePrice" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Sale Price ($)
                    </label>
                    <Input
                      id="salePrice"
                      name="salePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.salePrice ?? ""}
                      onChange={handleChange}
                      error={errors.salePrice}
                    />
                  </div>

                  <div>
                    <label 
                      htmlFor="inventory" 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Inventory *
                    </label>
                    <Input
                      id="inventory"
                      name="inventory"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.inventory}
                      onChange={handleChange}
                      error={errors.inventory}
                    />
                  </div>
                </div>

                {/* Images & Settings */}
                <div className="space-y-6">
                  <div>
                    <label 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Product Images
                    </label>
                    
                    {/* Image preview area */}
                    {previewUrls.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        {previewUrls.map((url, index) => (
                          <div key={index} className="relative rounded-md overflow-hidden border border-gray-200 group">
                            <div className="aspect-w-1 aspect-h-1 w-full">
                              <Image
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="object-cover"
                                width={200}
                                height={200}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm opacity-80 hover:opacity-100"
                            >
                              <FaTimesCircle className="h-5 w-5 text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* File upload button */}
                    <div className="mt-2">
                      <input
                        type="file"
                        id="productImages"
                        ref={fileInputRef}
                        accept="image/*"
                        multiple
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full border-dashed border-2 py-6 flex flex-col items-center justify-center"
                      >
                        <FaUpload className="h-6 w-6 mb-2 text-gray-500" />
                        <span className="text-sm font-medium">Click to upload product images</span>
                        <span className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</span>
                      </Button>
                    </div>
                    
                    {/* Optional: Keep URL input as fallback */}
                    <div className="mt-4">
                      <label 
                        htmlFor="images" 
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Or enter image URLs (optional)
                      </label>
                      <Input
                        id="images"
                        name="images"
                        placeholder="Enter image URLs, separated by commas"
                        value={formData.images}
                        onChange={handleChange}
                        error={errors.images}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter URLs separated by commas, e.g., https://example.com/image1.jpg, https://example.com/image2.jpg
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        id="isFeatured"
                        name="isFeatured"
                        type="checkbox"
                        checked={formData.isFeatured}
                        onChange={handleChange}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isFeatured"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Feature this product
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        id="isPublished"
                        name="isPublished"
                        type="checkbox"
                        checked={formData.isPublished}
                        onChange={handleChange}
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isPublished"
                        className="ml-2 block text-sm text-gray-900"
                      >
                        Publish product (visible to customers)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  className="flex items-center gap-2"
                >
                  <FaSave className="h-4 w-4" />
                  Save Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 