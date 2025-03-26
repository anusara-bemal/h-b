// Enhanced types with additional properties
export interface ExtendedUser extends User {
  orders?: Order[];
}

export interface CartItemWithProduct extends CartItem {
  product: Product;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
}

export interface ProductWithCategory extends Product {
  category: Category;
}

// Auth types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// UI types
export interface NavItem {
  title: string;
  href: string;
}

// Dashboard types
export interface DashboardStat {
  id: string;
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  trend?: 'up' | 'down';
}

// Form types
export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  inventory: number;
  categoryId: string;
  images: string;
  isFeatured: boolean;
  isPublished: boolean;
}

export interface AddressFormData {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
}

// Product types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  category: Category;
  categoryId: string;
  images: string[];
  inventory: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  inventory: number;
  categoryId: string;
  images: string;
  isFeatured: boolean;
  isPublished: boolean;
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  products?: Product[];
}

// Cart types
export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

// Order types
export interface Order {
  id: string;
  userId: string;
  user: User;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  paymentStatus: "pending" | "paid" | "failed";
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  price: number;
}

// Address type
export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

// Session types
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
}

export interface Session {
  user: SessionUser;
  expires: string;
}