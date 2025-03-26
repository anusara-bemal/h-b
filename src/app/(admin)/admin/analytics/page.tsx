"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { useEffect, useState } from "react";
import { FaArrowUp, FaArrowDown, FaChartLine, FaShoppingBag, FaUsers, FaBoxOpen, FaSpinner } from "react-icons/fa";

// Import Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Types for analytics data
type SalesDataPoint = {
  date: string;
  revenue: number;
  orderCount: number;
};

type ProductData = {
  id: string;
  name: string;
  price: number;
  totalSold: number;
  totalRevenue: number;
};

type CategoryData = {
  id: string;
  name: string;
  revenue: number;
};

type RecentOrder = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  customerName: string;
};

type AnalyticsData = {
  salesData: SalesDataPoint[];
  topProducts: ProductData[];
  categoryRevenue: CategoryData[];
  totals: {
    orders: number;
    products: number;
    users: number;
    revenue: number;
  };
  recentOrders: RecentOrder[];
};

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        // Add cache-busting timestamp to prevent cached responses
        const response = await fetch(`/api/admin/analytics?t=${Date.now()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch analytics data');
        }
        
        const data = await response.json();
        console.log("Analytics data:", data); // Log data for debugging
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Prepare chart data from the API data
  const getRevenueChartData = () => {
    if (!analyticsData?.salesData || analyticsData.salesData.length === 0) {
      return {
        labels: ['No Data Available'],
        datasets: [{
      label: 'Revenue',
          data: [0],
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'rgba(34, 197, 94, 0.1)',
      fill: true,
      tension: 0.4
        }]
      };
    }

    const sortedData = [...analyticsData.salesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      labels: sortedData.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [{
        label: 'Revenue',
        data: sortedData.map(item => item.revenue),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  };

  const getOrdersChartData = () => {
    if (!analyticsData?.salesData || analyticsData.salesData.length === 0) {
      return {
        labels: ['No Data Available'],
        datasets: [{
      label: 'Orders',
          data: [0],
      backgroundColor: 'rgb(59, 130, 246)',
      borderRadius: 6
        }]
      };
    }

    const sortedData = [...analyticsData.salesData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    return {
      labels: sortedData.map(item => new Date(item.date).toLocaleDateString()),
      datasets: [{
        label: 'Orders',
        data: sortedData.map(item => item.orderCount),
        backgroundColor: 'rgb(59, 130, 246)',
        borderRadius: 6
      }]
    };
  };

  const getCategoryChartData = () => {
    if (!analyticsData?.categoryRevenue || analyticsData.categoryRevenue.length === 0) {
      return {
        labels: ['No Categories'],
        datasets: [{
      label: 'Sales by Category',
          data: [0],
          backgroundColor: ['rgb(209, 213, 219)'],
          borderWidth: 1
        }]
      };
    }

    const colors = [
        'rgb(34, 197, 94)',
        'rgb(59, 130, 246)',
        'rgb(168, 85, 247)',
        'rgb(249, 115, 22)',
      'rgb(236, 72, 153)',
      'rgb(14, 165, 233)',
      'rgb(234, 179, 8)',
      'rgb(239, 68, 68)'
    ];

    return {
      labels: analyticsData.categoryRevenue.map(cat => cat.name),
      datasets: [{
        label: 'Sales by Category',
        data: analyticsData.categoryRevenue.map(cat => cat.revenue),
        backgroundColor: analyticsData.categoryRevenue.map((_, index) => colors[index % colors.length]),
      borderWidth: 1
      }]
    };
  };

  // Format numbers for display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  // Get stats with real data
  const getStats = () => {
    if (!analyticsData) {
      return [
  {
    id: "revenue",
    title: "Total Revenue",
          value: 0,
    icon: <FaChartLine className="h-6 w-6 text-green-600" />,
          change: 0,
    trend: "up" as const,
  },
  {
    id: "orders",
    title: "Total Orders",
          value: 0,
    icon: <FaShoppingBag className="h-6 w-6 text-blue-600" />,
          change: 0,
    trend: "up" as const,
  },
  {
          id: "users",
          title: "Total Users",
          value: 0,
    icon: <FaUsers className="h-6 w-6 text-purple-600" />,
          change: 0,
    trend: "up" as const,
  },
  {
    id: "products",
          title: "Total Products",
          value: 0,
    icon: <FaBoxOpen className="h-6 w-6 text-orange-600" />,
          change: 0,
          trend: "up" as const,
        },
      ];
    }

    return [
      {
        id: "revenue",
        title: "Total Revenue",
        value: analyticsData.totals.revenue,
        icon: <FaChartLine className="h-6 w-6 text-green-600" />,
        change: 0,
        trend: "up" as const,
      },
      {
        id: "orders",
        title: "Total Orders",
        value: analyticsData.totals.orders,
        icon: <FaShoppingBag className="h-6 w-6 text-blue-600" />,
        change: 0,
        trend: "up" as const,
      },
      {
        id: "users",
        title: "Total Users",
        value: analyticsData.totals.users,
        icon: <FaUsers className="h-6 w-6 text-purple-600" />,
        change: 0,
        trend: "up" as const,
      },
      {
        id: "products",
        title: "Total Products",
        value: analyticsData.totals.products,
        icon: <FaBoxOpen className="h-6 w-6 text-orange-600" />,
        change: 0,
        trend: "up" as const,
      },
    ];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <FaSpinner className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (error) {
  return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
          <p>Error loading analytics data: {error}</p>
          <p className="mt-2">
            Please check your database connection and make sure the API endpoint is working correctly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Analytics Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {getStats().map((stat) => (
          <Card key={stat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-medium text-gray-500">{stat.title}</h3>
                {stat.icon}
                      </div>
              <div className="flex items-baseline">
                <div className="text-2xl font-semibold text-black">
                  {stat.id === "revenue" ? formatPrice(stat.value) : formatNumber(stat.value)}
                </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle>Revenue Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
              <Line
                data={getRevenueChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
              </div>
            </CardContent>
          </Card>
          
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle>Orders Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
              <Bar
                data={getOrdersChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
              </div>
            </CardContent>
          </Card>
        </div>
        
      {/* Category breakdown and Top Products */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle>Revenue by Category</CardTitle>
            </CardHeader>
            <CardContent>
            <div className="h-80 flex items-center justify-center">
              <Doughnut
                data={getCategoryChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  },
                }}
              />
              </div>
            </CardContent>
          </Card>
          
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
              <CardTitle>Top Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                <thead>
                  <tr className="border-b text-xs uppercase">
                    <th className="px-4 py-2 text-left font-medium text-gray-500">Product</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Units Sold</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-500">Revenue</th>
                    </tr>
                  </thead>
                <tbody className="divide-y">
                  {analyticsData?.topProducts && analyticsData.topProducts.length > 0 ? (
                    analyticsData.topProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{product.name}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatNumber(product.totalSold)}</td>
                        <td className="px-4 py-3 text-right font-medium text-black">{formatPrice(product.totalRevenue)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No product data available
                      </td>
                    </tr>
                  )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      
      {/* Recent Orders */}
      <Card className="hover:shadow-md transition-shadow mb-6">
        <CardHeader className="pb-2">
          <CardTitle>Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-xs uppercase">
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Order ID</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Customer</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Date</th>
                  <th className="px-4 py-2 text-right font-medium text-gray-500">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {analyticsData?.recentOrders && analyticsData.recentOrders.length > 0 ? (
                  analyticsData.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-blue-600 font-medium">{order.id}</td>
                      <td className="px-4 py-3 text-gray-900">{order.customerName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`
                        }>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-black">{formatPrice(order.total)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </div>
        </CardContent>
      </Card>
    </div>
  );
} 