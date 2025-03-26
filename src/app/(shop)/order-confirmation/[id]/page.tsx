"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatDate, formatPrice, getSafeImageUrl } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaCheck, FaShoppingCart } from "react-icons/fa";

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
};

type Address = {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

type Order = {
  id: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "canceled";
  paymentStatus?: "pending" | "paid" | "failed";
  paymentMethod?: "cash_on_delivery" | "bank_transfer";
  shippingAddress: Address;
  billingAddress: Address;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
};

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to fetch order (status ${response.status})`);
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (error) {
        console.error("Error fetching order:", error);
        setError(`Failed to load your order: ${error instanceof Error ? error.message : String(error)}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <p className="text-xl text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-gray-50 min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white p-8 rounded-lg shadow-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find the order you're looking for.</p>
            <Button asChild>
              <Link href="/products">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/products" className="text-green-600 hover:text-green-700">
            <FaArrowLeft className="inline mr-2" /> Continue Shopping
          </Link>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center">
                <div className="mr-4 bg-green-100 p-3 rounded-full">
                  <FaCheck className="text-green-600" size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Thank you for your order!</h1>
                  <p className="text-gray-600">Your order has been received and is being processed.</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Order ID:</p>
              <p className="font-medium">{order.id}</p>
              <p className="text-sm text-gray-500 mt-2">Date:</p>
              <p className="font-medium">{formatDate(new Date(order.createdAt))}</p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="text-lg font-semibold mb-3">Shipping Information</h2>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="font-medium">{order.customer.firstName} {order.customer.lastName}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                    {order.shippingAddress.postalCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="mt-2">{order.customer.email}</p>
                  <p>{order.customer.phone}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Order Status</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <div className="flex justify-between mb-3">
                    <span className="text-gray-600">Order Status:</span>
                    <span className="capitalize font-medium">
                      {order.status === "pending" && (
                        <span className="text-yellow-600">Pending</span>
                      )}
                      {order.status === "processing" && (
                        <span className="text-blue-600">Processing</span>
                      )}
                      {order.status === "shipped" && (
                        <span className="text-indigo-600">Shipped</span>
                      )}
                      {order.status === "delivered" && (
                        <span className="text-green-600">Delivered</span>
                      )}
                      {order.status === "canceled" && (
                        <span className="text-red-600">Canceled</span>
                      )}
                    </span>
                  </div>
                  {order.paymentStatus && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className="capitalize font-medium">
                        {order.paymentStatus === "pending" && (
                          <span className="text-yellow-600">Pending</span>
                        )}
                        {order.paymentStatus === "paid" && (
                          <span className="text-green-600">Paid</span>
                        )}
                        {order.paymentStatus === "failed" && (
                          <span className="text-red-600">Failed</span>
                        )}
                      </span>
                    </div>
                  )}
                  {order.paymentMethod && (
                    <div className="flex justify-between mt-3">
                      <span className="text-gray-600">Payment Method:</span>
                      <span className="capitalize font-medium">
                        {order.paymentMethod === "cash_on_delivery" ? "Cash on Delivery" : 
                         order.paymentMethod === "bank_transfer" ? "Bank Transfer" : 
                         order.paymentMethod}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 font-semibold text-sm text-gray-600">Product</th>
                    <th className="px-4 py-2 font-semibold text-sm text-gray-600 text-right">Price</th>
                    <th className="px-4 py-2 font-semibold text-sm text-gray-600 text-right">Quantity</th>
                    <th className="px-4 py-2 font-semibold text-sm text-gray-600 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {order.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="font-medium text-gray-900">{item.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">{formatPrice(item.price)}</td>
                      <td className="px-4 py-4 text-right">{item.quantity}</td>
                      <td className="px-4 py-4 text-right font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-gray-200">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-medium">
                      Order Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatPrice(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-6">
            If you have any questions about your order, please contact our customer service.
          </p>
          <Button asChild>
            <Link href="/products">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 