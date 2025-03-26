"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function CreateCategory() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formValues, setFormValues] = useState({
    name: "",
    slug: "",
    description: "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitError, setSubmitError] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (file.type.startsWith('image/')) {
      // Revoke old preview URL if it exists
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      
      setSelectedImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };
  
  const removeSelectedImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Auto-generate slug from name if it's the name field being edited
    if (name === "name") {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormValues((prev) => ({ ...prev, slug }));
    }
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formValues.name.trim()) {
      errors.name = "Category name is required";
    }
    
    if (!formValues.slug.trim()) {
      errors.slug = "Slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formValues.slug)) {
      errors.slug = "Slug can only contain lowercase letters, numbers, and hyphens";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setSubmitError("");
    
    try {
      // Create FormData object for file upload
      const formData = new FormData();
      
      // Add form fields
      formData.append("name", formValues.name);
      formData.append("slug", formValues.slug);
      formData.append("description", formValues.description);
      
      // Add image if selected
      if (selectedImage) {
        formData.append("categoryImage", selectedImage);
      }
      
      // Send the form data
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create category");
      }
      
      // Redirect to categories page
      router.push("/admin/categories");
    } catch (error: any) {
      console.error("Error creating category:", error);
      setSubmitError(error.message || "Failed to create category");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Category</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Category Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              formErrors.name ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-1">
            Slug *
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            value={formValues.slug}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-md ${
              formErrors.slug ? "border-red-500" : "border-gray-300"
            } focus:outline-none focus:ring-2 focus:ring-green-500`}
          />
          {formErrors.slug && (
            <p className="mt-1 text-sm text-red-500">{formErrors.slug}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Used for URLs. Example: "organic-herbs"
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formValues.description}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Category Image</h3>
          
          {/* Image Preview */}
          {previewUrl && (
            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Selected Image:</p>
              <div className="relative">
                <div className="border rounded-md overflow-hidden w-48 h-48 relative">
                  <Image 
                    src={previewUrl} 
                    alt="Category image preview"
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 w-6 h-6 flex items-center justify-center text-xs"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {/* Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-md transition duration-200"
          >
            Select Image
          </button>
          <p className="text-sm text-gray-500 mt-2">
            Select an image for this category. Supported formats: JPG, PNG, GIF, SVG.
          </p>
        </div>
        
        <div className="mt-8 flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-6 rounded-md ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {isLoading ? "Creating..." : "Create Category"}
          </button>
          
          <a
            href="/admin/categories"
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
      </form>
    </div>
  );
} 