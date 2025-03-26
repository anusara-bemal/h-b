"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate, formatPrice } from "@/lib/utils";
import { useState, useEffect } from "react";
import { 
  FaSearch, 
  FaFilter, 
  FaTruck, 
  FaBox, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaFileInvoice, 
  FaSort,
  FaSortUp,
  FaSortDown,
  FaEye
} from "react-icons/fa";

type Order = {
  id: string;
  userId: string;
  user: {
    name: string;
    email: string;
  };
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'failed';
  paymentMethod: 'cash_on_delivery' | 'bank_transfer' | 'N/A';
  paymentDetails?: {
    cashOnDelivery?: boolean;
    paymentProofUrl?: string;
  };
  createdAt: string;
  items: {
    id: string;
    productId: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
};

type SortField = 'id' | 'user.name' | 'total' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch orders from API
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Orders data:', data);
        
        // Map API response to Order type
        const mappedOrders: Order[] = data.map((order: any) => ({
          id: String(order.id),
          userId: order.userId,
            user: {
            name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Unknown',
            email: order.customer?.email || 'Unknown',
          },
          total: order.total,
          status: order.status || 'processing',
          paymentStatus: order.paymentStatus || 'pending',
          paymentMethod: order.paymentMethod || 'N/A',
          paymentDetails: order.paymentDetails || {},
          createdAt: new Date(order.createdAt).toISOString(),
          items: order.items?.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })) || [],
          address: order.shippingAddress || {},
        }));
        
        setOrders(mappedOrders);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError(`Failed to fetch orders: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchOrders();
  }, []);

  // Filter and sort orders
  const filteredAndSortedOrders = [...orders]
    .filter(order => {
      // Apply search filter
      const matchesSearch = 
        String(order.id).toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.user.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply status filter
      const matchesStatus = statusFilter ? order.status === statusFilter : true;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      // Apply sorting
      let comparison = 0;
      
      if (sortField === 'total') {
        comparison = a.total - b.total;
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortField === 'user.name') {
        comparison = a.user.name.localeCompare(b.user.name);
      } else if (sortField === 'status') {
        comparison = a.status.localeCompare(b.status);
      } else {
        comparison = a.id.localeCompare(b.id);
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    return sortDirection === 'asc' ? <FaSortUp className="ml-1 text-green-600" /> : <FaSortDown className="ml-1 text-green-600" />;
  };

  // Update order status
  const handleUpdateStatus = async (orderId: string, newStatus: Order['status']) => {
    // In a real application, this would be an API call
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update order status');
      }
      
      // If successful, update the UI
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: newStatus } 
            : order
        )
      );
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      // Handle error (could show a toast notification)
    }
  };

  // View order details
  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  // Close order details
  const closeOrderDetails = () => {
    setSelectedOrder(null);
  };

  // Render status badge
  const renderStatusBadge = (status: Order['status']) => {
    let colors = "";
    let icon = null;
    
    switch (status) {
      case 'delivered':
        colors = "bg-green-100 text-green-800";
        icon = <FaCheckCircle className="mr-1 h-3 w-3" />;
        break;
      case 'shipped':
        colors = "bg-blue-100 text-blue-800";
        icon = <FaTruck className="mr-1 h-3 w-3" />;
        break;
      case 'processing':
        colors = "bg-yellow-100 text-yellow-800";
        icon = <FaBox className="mr-1 h-3 w-3" />;
        break;
      case 'pending':
        colors = "bg-purple-100 text-purple-800";
        icon = <FaFileInvoice className="mr-1 h-3 w-3" />;
        break;
      case 'cancelled':
        colors = "bg-red-100 text-red-800";
        icon = <FaTimesCircle className="mr-1 h-3 w-3" />;
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Update payment status
  const handleUpdatePaymentStatus = async (orderId: string, newStatus: Order['paymentStatus']) => {
    // Call the API to update payment status
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentStatus: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }
      
      // If successful, update the UI
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, paymentStatus: newStatus } 
            : order
        )
      );
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: newStatus });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      // Handle error (could show a toast notification)
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">Loading orders data...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
        <div className="bg-red-50 rounded-lg shadow p-6 text-center border border-red-200">
          <p className="text-red-600">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!orders.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Orders Management</h1>
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-600">No orders found in the database.</p>
          <p className="text-gray-500 text-sm mt-2">
            Orders will appear here after customers complete checkout.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Order Management</h1>
      
      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search orders by ID or customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="w-full md:w-64">
          <div className="relative">
            <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 pl-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-gray-700 text-sm">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium">
                      <button 
                        onClick={() => handleSort('id')}
                        className="flex items-center font-medium"
                      >
                        Order ID
                        {renderSortIcon('id')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-medium">
                      <button 
                        onClick={() => handleSort('user.name')}
                        className="flex items-center font-medium"
                      >
                        Customer
                        {renderSortIcon('user.name')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-medium">
                      <button 
                        onClick={() => handleSort('createdAt')}
                        className="flex items-center font-medium"
                      >
                        Date
                        {renderSortIcon('createdAt')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-medium">
                      <button 
                        onClick={() => handleSort('total')}
                        className="flex items-center font-medium"
                      >
                        Total
                        {renderSortIcon('total')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left font-medium">
                      <button 
                        onClick={() => handleSort('status')}
                        className="flex items-center font-medium"
                      >
                        Status
                        {renderSortIcon('status')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredAndSortedOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-blue-600">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="font-medium text-gray-900">{order.user.name}</div>
                          <div className="text-gray-500 text-sm">{order.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <span className="text-black">{formatPrice(order.total)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => viewOrderDetails(order)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <FaEye className="h-4 w-4" />
                          </Button>
                          
                          {/* Status update buttons */}
                          {order.status === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'processing')}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              Process
                            </Button>
                          )}
                          {order.status === 'processing' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'shipped')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              Ship
                            </Button>
                          )}
                          {order.status === 'shipped' && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'delivered')}
                              className="text-green-600 hover:text-green-700"
                            >
                              Deliver
                            </Button>
                          )}
                          {(order.status === 'pending' || order.status === 'processing') && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                              className="text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No orders found</p>
              <p className="text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
                  <p className="text-gray-600">{selectedOrder.id}</p>
                </div>
                <button 
                  onClick={closeOrderDetails}
                  className="text-gray-400 hover:text-gray-500"
                >
                  &times;
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Information</h3>
                  <p className="text-gray-700"><strong>Name:</strong> {selectedOrder.user.name}</p>
                  <p className="text-gray-700"><strong>Email:</strong> {selectedOrder.user.email}</p>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Shipping Address</h3>
                  <p className="text-gray-700">{selectedOrder.address.street}</p>
                  <p className="text-gray-700">
                    {selectedOrder.address.city}, {selectedOrder.address.state} {selectedOrder.address.postalCode}
                  </p>
                  <p className="text-gray-700">{selectedOrder.address.country}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Information</h3>
                  <p className="text-gray-700">
                    <strong>Payment Method:</strong> {selectedOrder.paymentMethod === 'cash_on_delivery' 
                      ? 'Cash on Delivery' 
                      : selectedOrder.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'N/A'}
                  </p>
                  <p className="text-gray-700">
                    <strong>Payment Status:</strong>{' '}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${selectedOrder.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 
                        selectedOrder.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {selectedOrder.paymentStatus === 'paid' ? 'Paid' : 
                        selectedOrder.paymentStatus === 'pending' ? 'Pending' : 'Failed'}
                    </span>
                  </p>
                  
                  {selectedOrder.paymentMethod === 'bank_transfer' && selectedOrder.paymentDetails?.paymentProofUrl && (
                    <div className="mt-4">
                      <strong className="block text-sm font-medium text-gray-700 mb-1">Payment Proof:</strong>
                      <div className="mt-1 relative h-32 w-full bg-gray-100 rounded-md overflow-hidden border">
                        <img 
                          src={selectedOrder.paymentDetails.paymentProofUrl} 
                          alt="Payment Proof" 
                          className="object-contain w-full h-full"
                        />
                      </div>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => window.open(selectedOrder.paymentDetails.paymentProofUrl, '_blank')}>
                        View Full Image
                      </Button>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Status</h3>
                  <p className="flex items-center text-gray-700 mb-2">
                    <span className={`inline-flex mr-2 items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${selectedOrder.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                        selectedOrder.status === 'shipped' ? 'bg-blue-100 text-blue-800' : 
                        selectedOrder.status === 'processing' ? 'bg-purple-100 text-purple-800' :
                        selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                      {selectedOrder.status === 'delivered' ? 'Delivered' : 
                        selectedOrder.status === 'shipped' ? 'Shipped' : 
                        selectedOrder.status === 'processing' ? 'Processing' :
                        selectedOrder.status === 'pending' ? 'Pending' :
                        'Cancelled'}
                    </span>
                  </p>
                  
                  <div className="bg-gray-50 p-3 rounded-md mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Update Order Status</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.status === 'pending' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}
                        >
                          Mark as Processing
                        </Button>
                      )}
                      {selectedOrder.status === 'processing' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}
                        >
                          Mark as Shipped
                        </Button>
                      )}
                      {selectedOrder.status === 'shipped' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}
                        >
                          Mark as Delivered
                        </Button>
                      )}
                      {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {selectedOrder.paymentMethod === 'bank_transfer' && selectedOrder.paymentStatus === 'pending' && (
                    <div className="bg-gray-50 p-3 rounded-md mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Update Payment Status</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'paid')}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          Confirm Payment
                        </Button>
                        <Button 
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdatePaymentStatus(selectedOrder.id, 'failed')}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Reject Payment
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Order Details</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-black text-right">{formatPrice(item.price)}</td>
                          <td className="px-4 py-3 text-sm text-black text-right">
                            <span className="text-black">{formatPrice(item.price * item.quantity)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total</td>
                        <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                          <span className="text-black">{formatPrice(selectedOrder.total)}</span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              
              <div className="flex justify-end border-t pt-6">
                  <Button variant="outline" onClick={closeOrderDetails}>
                    Close
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderDetails({ order }: { order: Order }) {
  // Check if order has items
  if (!order.items || order.items.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Order #{order.id}</h3>
        <div className="bg-yellow-50 p-4 rounded-md text-yellow-800 mb-4">
          This order has no items.
        </div>
      </div>
    );
  }

  // Get the address with fallbacks
  const address = order.address || {};
  const addressString = [
    address.street,
    address.city,
    address.state,
    address.postalCode,
    address.country
  ].filter(Boolean).join(', ');

  // Format date
  const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Order #{order.id}</h3>
      
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700"><strong>Name:</strong> {order.user?.name || 'N/A'}</p>
            <p className="text-gray-700"><strong>Email:</strong> {order.user?.email || 'N/A'}</p>
            <p className="text-gray-700"><strong>Date:</strong> {formattedDate}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">
              <strong>Status:</strong> <OrderStatusBadge status={order.status} />
            </p>
            <p className="text-gray-700">
              <strong>Payment Status:</strong> <PaymentStatusBadge status={order.paymentStatus || 'pending'} />
            </p>
            <p className="text-gray-700">
              <strong>Payment Method:</strong> {
                order.paymentMethod === 'cash_on_delivery' ? 'Cash on Delivery' :
                order.paymentMethod === 'bank_transfer' ? 'Bank Transfer' : 'N/A'
              }
            </p>
            <p className="text-gray-700">
              <strong>Total:</strong> ${order.total.toFixed(2)}
            </p>
            {addressString && (
              <p className="text-gray-700">
                <strong>Shipping Address:</strong> {addressString || 'N/A'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Item</th>
                  <th className="text-right py-3 px-4">Price</th>
                  <th className="text-right py-3 px-4">Quantity</th>
                  <th className="text-right py-3 px-4">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-3 px-4">{item.name}</td>
                    <td className="text-right py-3 px-4">${item.price.toFixed(2)}</td>
                    <td className="text-right py-3 px-4">{item.quantity}</td>
                    <td className="text-right py-3 px-4">${(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
                <tr className="font-semibold">
                  <td colSpan={3} className="text-right py-3 px-4">Total</td>
                  <td className="text-right py-3 px-4">${order.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 