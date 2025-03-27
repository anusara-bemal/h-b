"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  FaShoppingBag,
  FaUsers,
  FaBoxOpen,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaBox,
  FaTruck,
  FaCheckCircle,
  FaTimesCircle,
  FaPlus,
  FaEye,
  FaClipboardList,
  FaTachometerAlt,
  FaExclamationTriangle,
  FaSpinner,
  FaLeaf,
} from "react-icons/fa";

// Types for analytics data
type AnalyticsData = {
  totals: {
    revenue: number;
    orders: number;
    users: number;
    products: number;
  };
  recentOrders?: any[];
  topProducts?: any[];
};

// Quick actions for admin
const quickActions = [
  {
    title: "Add New Product",
    icon: <FaPlus className="w-5 h-5" />,
    href: "/admin/products",
    color: "bg-gradient-to-br from-blue-200 to-blue-300",
    iconColor: "text-blue-600",
    hoverGradient: "hover:bg-gradient-to-br hover:from-blue-300 hover:to-blue-400",
    borderColor: "border-blue-400",
    textColor: "text-blue-800",
  },
  {
    title: "View Orders",
    icon: <FaClipboardList className="w-5 h-5" />,
    href: "/admin/orders",
    color: "bg-gradient-to-br from-green-200 to-green-300",
    iconColor: "text-green-600",
    hoverGradient: "hover:bg-gradient-to-br hover:from-green-300 hover:to-green-400",
    borderColor: "border-green-400",
    textColor: "text-green-800",
  },
  {
    title: "Manage Categories",
    icon: <FaBox className="w-5 h-5" />,
    href: "/admin/categories",
    color: "bg-gradient-to-br from-purple-200 to-purple-300",
    iconColor: "text-purple-600",
    hoverGradient: "hover:bg-gradient-to-br hover:from-purple-300 hover:to-purple-400",
    borderColor: "border-purple-400",
    textColor: "text-purple-800",
  },
  {
    title: "Analytics",
    icon: <FaTachometerAlt className="w-5 h-5" />,
    href: "/admin/analytics",
    color: "bg-gradient-to-br from-orange-200 to-orange-300",
    iconColor: "text-orange-600",
    hoverGradient: "hover:bg-gradient-to-br hover:from-orange-300 hover:to-orange-400",
    borderColor: "border-orange-400",
    textColor: "text-orange-800",
  },
];

// Animation variants
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function AdminDashboardPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("week");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from the analytics API
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/analytics?t=${Date.now()}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch analytics data');
        }
        
        const data = await response.json();
        console.log("Dashboard analytics data:", data);
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

  // Get real stats from the API data
  const getRealStats = () => {
    if (!analyticsData) {
      return [
        {
          id: "revenue",
          title: "Total Revenue",
          value: 0,
          icon: <FaChartLine className="h-6 w-6" />,
          change: 0,
          trend: "up" as const,
          gradient: "from-green-500 to-emerald-700",
          iconBg: "bg-gradient-to-br from-green-400 to-green-600",
          shadow: "shadow-black",
        },
        {
          id: "orders",
          title: "Total Orders",
          value: 0,
          icon: <FaShoppingBag className="h-6 w-6" />,
          change: 0,
          trend: "up" as const,
          gradient: "from-blue-500 to-indigo-700",
          iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
          shadow: "shadow-black",
        },
        {
          id: "customers",
          title: "Total Customers",
          value: 0,
          icon: <FaUsers className="h-6 w-6" />,
          change: 0,
          trend: "up" as const,
          gradient: "from-purple-500 to-violet-700",
          iconBg: "bg-gradient-to-br from-purple-400 to-purple-600",
          shadow: "shadow-black",
        },
        {
          id: "products",
          title: "Active Products",
          value: 0,
          icon: <FaBoxOpen className="h-6 w-6" />,
          change: 0,
          trend: "up" as const,
          gradient: "from-orange-500 to-amber-700",
          iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
          shadow: "shadow-black",
        },
      ];
    }

    return [
      {
        id: "revenue",
        title: "Total Revenue",
        value: analyticsData.totals.revenue,
        icon: <FaChartLine className="h-6 w-6" />,
        change: 0,
        trend: "up" as const,
        gradient: "from-green-500 to-emerald-700",
        iconBg: "bg-gradient-to-br from-green-400 to-green-600",
        shadow: "shadow-black",
      },
      {
        id: "orders",
        title: "Total Orders",
        value: analyticsData.totals.orders,
        icon: <FaShoppingBag className="h-6 w-6" />,
        change: 0,
        trend: "up" as const,
        gradient: "from-blue-500 to-indigo-700",
        iconBg: "bg-gradient-to-br from-blue-400 to-blue-600",
        shadow: "shadow-black",
      },
      {
        id: "customers",
        title: "Total Customers",
        value: analyticsData.totals.users,
        icon: <FaUsers className="h-6 w-6" />,
        change: 0,
        trend: "up" as const,
        gradient: "from-purple-500 to-violet-700",
        iconBg: "bg-gradient-to-br from-purple-400 to-purple-600", 
        shadow: "shadow-black",
      },
      {
        id: "products",
        title: "Active Products",
        value: analyticsData.totals.products,
        icon: <FaBoxOpen className="h-6 w-6" />,
        change: 0,
        trend: "up" as const,
        gradient: "from-orange-500 to-amber-700",
        iconBg: "bg-gradient-to-br from-orange-400 to-orange-600",
        shadow: "shadow-black",
      },
    ];
  };

  // Main JSX render
  return (
    <div className="flex flex-col gap-8 p-6 bg-gradient-to-br from-gray-50 to-white">
      <motion.div 
        className="flex flex-col gap-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, Admin</h1>
        <p className="text-gray-800 font-medium">Here's what's happening with your store today.</p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <FaSpinner className="h-8 w-8 text-green-600" />
          </motion.div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <FaExclamationTriangle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">Error loading data: {error}</p>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {getRealStats().map((stat) => (
              <motion.div key={stat.id} variants={item}>
                <Card className="border-0 bg-white shadow-lg overflow-hidden">
                  <CardContent className="p-0">
                    <div 
                      className={`flex items-start justify-between px-6 py-6 bg-gradient-to-br ${stat.gradient} text-white`}
                    >
                      <div>
                        <p className="text-white/80 font-medium text-sm uppercase tracking-wider">
                          {stat.title}
                        </p>
                        <h3 className="text-2xl font-bold mt-1">
                          {stat.id === 'revenue' 
                            ? formatPrice(stat.value) 
                            : stat.value.toLocaleString()}
                        </h3>
                      </div>
                      <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stat.iconBg} shadow-xl`}>
                        {stat.icon}
                      </div>
                    </div>
                    <div className="px-6 py-4 bg-white flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        {stat.trend === 'up' ? (
                          <FaArrowUp className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <FaArrowDown className="h-3.5 w-3.5 text-red-500" />
                        )}
                        <span className={stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                          {stat.change}%
                        </span>
                      </div>
                      <span className="text-gray-500 text-sm">vs last {timeRange}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action) => (
                <Link 
                  key={action.title} 
                  href={action.href}
                  className={`${action.color} ${action.hoverGradient} border ${action.borderColor} rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md flex items-center gap-3`}
                >
                  <div className={`w-10 h-10 rounded-full bg-white flex items-center justify-center ${action.iconColor}`}>
                    {action.icon}
                  </div>
                  <span className={`font-medium ${action.textColor}`}>{action.title}</span>
                </Link>
              ))}
            </div>
          </motion.div>

          {/* Recent Orders and Top Products */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Recent Orders */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <span>Recent Orders</span>
                    <Link href="/admin/orders">
                      <Button variant="ghost" size="sm" className="text-sm">View All</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData?.recentOrders && analyticsData.recentOrders.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.recentOrders.map((order: any) => (
                        <div 
                          key={order.id} 
                          className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-100"
                        >
                          <div>
                            <p className="font-medium text-gray-900">Order #{order.id}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <p className="text-sm text-gray-500">{order.customerName}</p>
                              <span className="text-gray-300">•</span>
                              <p className="text-sm text-gray-500">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-medium text-gray-900">{formatPrice(order.total)}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                              order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                              order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No recent orders</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Top Products */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl flex items-center justify-between">
                    <span>Top Products</span>
                    <Link href="/admin/products">
                      <Button variant="ghost" size="sm" className="text-sm">View All</Button>
                    </Link>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {analyticsData?.topProducts && analyticsData.topProducts.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.topProducts.map((product: any) => (
                        <div 
                          key={product.id} 
                          className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-100"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-md border border-gray-200 flex items-center justify-center text-green-600">
                              <FaLeaf className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">{formatPrice(product.price)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">{product.totalSold} sold</p>
                            <p className="text-sm text-gray-500">{formatPrice(product.totalRevenue)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-500">No product data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
} 