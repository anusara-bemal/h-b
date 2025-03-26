"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ProductFormData } from "@/types";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FaArrowLeft, FaSave, FaUpload, FaTimesCircle } from "react-icons/fa";
import Image from "next/image";
import { getSafeImageUrl } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { X, Upload } from "lucide-react";

// Dummy categories data
const categories = [
  { id: "cat1", name: "Tea" },
  { id: "cat2", name: "Essential Oils" },
  { id: "cat3", name: "Supplements" },
  { id: "cat4", name: "Skincare" },
];

export default function EditProduct({ params }: { params: { id: string } }) {
  const router = useRouter();
  const id = params.id;
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [formValues, setFormValues] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    salePrice: "",
    inventory: "0",
    categoryId: "",
    images: "",
    isFeatured: false,
    isPublished: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch product
        const productRes = await fetch(`/api/admin/products/${id}`);
        
        if (!productRes.ok) {
          throw new Error("Failed to fetch product");
        }
        
        const productData = await productRes.json();
        setProduct(productData);
        
        // Process images
        let imageArray: string[] = [];
        try {
          if (productData.images) {
            if (typeof productData.images === 'string') {
              // Try to parse JSON
              if (productData.images.trim().startsWith('[')) {
                imageArray = JSON.parse(productData.images);
              } else {
                // Or split by comma
                imageArray = productData.images.split(',').map((url: string) => url.trim()).filter(Boolean);
              }
            } else if (Array.isArray(productData.images)) {
              imageArray = productData.images;
            }
          }
        } catch (e) {
          console.error("Error parsing product images:", e);
          if (typeof productData.images === 'string' && 
             (productData.images.startsWith('http') || productData.images.startsWith('/'))) {
            imageArray = [productData.images];
          }
        }
        
        setProductImages(imageArray);
        
        // Set form values
        setFormValues({
          name: productData.name || "",
          slug: productData.slug || "",
          description: productData.description || "",
          price: productData.price ? productData.price.toString() : "",
          salePrice: productData.salePrice ? productData.salePrice.toString() : "",
          inventory: productData.inventory ? productData.inventory.toString() : "0",
          categoryId: productData.categoryId || "",
          images: productData.images || "",
          isFeatured: productData.isFeatured || false,
          isPublished: productData.isPublished !== false, // Default to true
        });
        
        // Fetch categories
        const categoriesRes = await fetch('/api/admin/categories');
        
        if (!categoriesRes.ok) {
          throw new Error("Failed to fetch categories");
        }
        
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  // Parse product images from response
  useEffect(() => {
    if (product?.images) {
      try {
        let parsedImages = [];
        if (typeof product.images === 'string') {
          if (product.images.startsWith('[')) {
            parsedImages = JSON.parse(product.images);
          } else if (product.images.includes(',')) {
            parsedImages = product.images.split(',').map(url => url.trim()).filter(Boolean);
          } else {
            parsedImages = [product.images];
          }
        } else if (Array.isArray(product.images)) {
          parsedImages = product.images;
        }
        setProductImages(parsedImages);
      } catch (e) {
        console.error("Error parsing product images:", e);
        setProductImages([]);
      }
    }
  }, [product]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles: File[] = [];
    const newPreviewUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        newFiles.push(file);
        newPreviewUrls.push(URL.createObjectURL(file));
      }
    }
    
    setSelectedFiles([...selectedFiles, ...newFiles]);
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
  };
  
  const removeSelectedImage = (index: number) => {
    // Release object URL to avoid memory leaks
    URL.revokeObjectURL(previewUrls[index]);
    
    // Remove file and preview
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
    setPreviewUrls(previewUrls.filter((_, i) => i !== index));
  };
  
  const removeExistingImage = (index: number) => {
    const newImages = [...productImages];
    newImages.splice(index, 1);
    setProductImages(newImages);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === "checkbox") {
      const { checked } = e.target as HTMLInputElement;
      setFormValues((prev) => ({ ...prev, [name]: checked }));
    } else if (type === "number") {
      setFormValues((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formValues.name.trim()) {
      newErrors.name = "Product name is required";
    }
    
    if (!formValues.description.trim()) {
      newErrors.description = "Product description is required";
    }
    
    if (formValues.price <= 0) {
      newErrors.price = "Price must be greater than zero";
    }
    
    if (formValues.salePrice !== undefined && formValues.salePrice >= formValues.price) {
      newErrors.salePrice = "Sale price must be less than regular price";
    }
    
    if (formValues.inventory < 0) {
      newErrors.inventory = "Inventory cannot be negative";
    }
    
    if (!formValues.categoryId) {
      newErrors.categoryId = "Please select a category";
    }
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files);
      setSelectedFiles(prev => [...prev, ...newImages]);
      
      // Create preview URLs for new images
      const newPreviewUrls = newImages.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviewUrls]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      return newUrls.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", formValues.name);
      formData.append("description", formValues.description);
      formData.append("price", formValues.price.toString());
      if (formValues.salePrice) formData.append("salePrice", formValues.salePrice.toString());
      formData.append("inventory", formValues.inventory.toString());
      formData.append("categoryId", formValues.categoryId.toString());
      formData.append("isFeatured", formValues.isFeatured.toString());
      formData.append("isPublished", formValues.isPublished.toString());

      // Append each image file
      selectedFiles.forEach((file, index) => {
        formData.append("images", file);
      });

      const response = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error("Failed to update product");
    } finally {
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Edit Product</h1>
      
      {isLoading ? (
        <div className="text-center">
          <div className="spinner" />
          <p>Loading product...</p>
        </div>
      ) : !product ? (
        <div className="bg-red-100 p-4 rounded">
          <p className="text-red-700">Product not found</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
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
                  value={formValues.name}
                  onChange={handleChange}
                  error={formErrors.name}
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
                  value={formValues.description}
                  onChange={handleChange}
                  className={`w-full rounded-md border ${
                    formErrors.description ? "border-red-500" : "border-gray-300"
                  } bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2`}
                />
                {formErrors.description && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.description}</p>
                )}
              </div>

              <div>
                <label 
                  htmlFor="categoryId" 
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Category *
                </label>
                <select
                  id="categoryId"
                  name="categoryId"
                  value={formValues.categoryId}
                  onChange={handleChange}
                  className={`w-full h-10 rounded-md border ${
                    formErrors.categoryId ? "border-red-500" : "border-gray-300"
                  } bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2`}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {formErrors.categoryId && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.categoryId}</p>
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
                  value={formValues.price}
                  onChange={handleChange}
                  error={formErrors.price}
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
                  value={formValues.salePrice ?? ""}
                  onChange={handleChange}
                  error={formErrors.salePrice}
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
                  value={formValues.inventory}
                  onChange={handleChange}
                  error={formErrors.inventory}
                />
              </div>
            </div>

            {/* Images & Settings */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Images</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Existing Images */}
                  {productImages.length > 0 && (
                    productImages.map((image: string, index: number) => (
                      <div key={index} className="relative group">
                        <Image
                          src={getSafeImageUrl(image)}
                          alt={`Product image ${index + 1}`}
                          width={200}
                          height={200}
                          className="rounded-lg object-cover w-full h-48"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newImages = [...productImages];
                            newImages.splice(index, 1);
                            setProductImages(newImages);
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))
                  )}
                  
                  {/* New Image Previews */}
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <Image
                        src={url}
                        alt={`New image ${index + 1}`}
                        width={200}
                        height={200}
                        className="rounded-lg object-cover w-full h-48"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Upload Button */}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-400" />
                        <p className="mb-1 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or GIF (MAX. 800x400px)</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="isFeatured"
                    name="isFeatured"
                    type="checkbox"
                    checked={formValues.isFeatured}
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
                    checked={formValues.isPublished}
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

          <div className="mt-8 flex items-center justify-between">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-md ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Updating..." : "Update Product"}
            </button>
            
            <a
              href="/admin/products"
              className="text-gray-500 hover:text-gray-700"
            >
              Cancel
            </a>
          </div>
          
          {submitError && (
            <div className="mt-4 bg-red-100 p-3 rounded-md">
              <p className="text-red-700">{submitError}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="mt-4 bg-green-100 p-3 rounded-md">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}
        </form>
      )}
    </div>
  );
} 