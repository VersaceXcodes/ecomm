import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for API responses
interface Order {
  order_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface OrdersResponse {
  orders: Order[];
  total: number;
}

interface WishlistResponse {
  total: number;
}

interface AddressesResponse {
  addresses: Array<{
    address_id: string;
    type: string;
    first_name: string;
    last_name: string;
  }>;
}

interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const UV_UserDashboard: React.FC = () => {
  // Individual Zustand selectors (CRITICAL: no object destructuring)
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);

  // API base URL
  const apiBaseUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  // User profile query
  const { data: userProfile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async (): Promise<User> => {
      const response = await axios.get(`${apiBaseUrl}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      return response.data;
    },
    enabled: !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Recent orders query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['recent-orders'],
    queryFn: async (): Promise<OrdersResponse> => {
      const response = await axios.get(`${apiBaseUrl}/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        params: {
          limit: 5,
          offset: 0,
          sort_by: 'created_at',
          sort_order: 'desc',
        },
      });
      return response.data;
    },
    enabled: !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Wishlist count query
  const { data: wishlistData, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist-count'],
    queryFn: async (): Promise<WishlistResponse> => {
      const response = await axios.get(`${apiBaseUrl}/wishlist`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
        params: {
          limit: 1,
          offset: 0,
        },
      });
      return response.data;
    },
    enabled: !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Address count query
  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses-count'],
    queryFn: async (): Promise<AddressesResponse> => {
      const response = await axios.get(`${apiBaseUrl}/user/addresses`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });
      return response.data;
    },
    enabled: !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Calculate order summary
  const orderSummary = React.useMemo(() => {
    if (!ordersData) {
      return { total_orders: 0, total_spent: 0, last_order_date: null };
    }
    
    const totalSpent = ordersData.orders.reduce((sum, order) => sum + order.total_amount, 0);
    const lastOrderDate = ordersData.orders[0]?.created_at || null;
    
    return {
      total_orders: ordersData.total,
      total_spent: totalSpent,
      last_order_date: lastOrderDate,
    };
  }, [ordersData]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateString));
  };

  // Loading state for dashboard
  const isDashboardLoading = profileLoading || ordersLoading || wishlistLoading || addressesLoading;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {currentUser?.first_name || userProfile?.first_name || 'User'}!
            </h1>
            <p className="text-gray-600">
              Manage your account, view orders, and track your preferences.
            </p>
          </div>

          {/* Dashboard Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Menu</h2>
                  <nav className="space-y-2">
                    <Link
                      to="/account"
                      className="flex items-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-md"
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      </svg>
                      Dashboard
                    </Link>
                    <Link
                      to="/account/orders"
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      Orders
                    </Link>
                    <Link
                      to="/account/addresses"
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Addresses
                    </Link>
                    <Link
                      to="/account/wishlist"
                      className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
                    >
                      <svg className="mr-3 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      Wishlist
                    </Link>
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Account Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Orders */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Orders</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isDashboardLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                        ) : (
                          orderSummary.total_orders
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Total Spent */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Spent</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isDashboardLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
                        ) : (
                          formatCurrency(orderSummary.total_spent)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Wishlist Items */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Wishlist Items</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {isDashboardLoading ? (
                          <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
                        ) : (
                          wishlistData?.total || 0
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
                </div>
                <div className="p-6">
                  {profileError ? (
                    <div className="text-red-600 text-sm">
                      Error loading profile information. Please try again.
                    </div>
                  ) : profileLoading ? (
                    <div className="space-y-4">
                      <div className="animate-pulse bg-gray-200 h-4 w-48 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-4 w-64 rounded"></div>
                      <div className="animate-pulse bg-gray-200 h-4 w-40 rounded"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Full Name</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {userProfile?.first_name} {userProfile?.last_name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email Address</p>
                        <p className="mt-1 text-sm text-gray-900">{userProfile?.email}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Phone Number</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {userProfile?.phone || 'Not provided'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Saved Addresses</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {addressesLoading ? '...' : `${addressesData?.addresses.length || 0} addresses`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                  <Link
                    to="/account/orders"
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    View All
                  </Link>
                </div>
                <div className="p-6">
                  {ordersLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                          <div className="space-y-2">
                            <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
                            <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                          </div>
                          <div className="animate-pulse bg-gray-200 h-4 w-16 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : ordersData?.orders.length ? (
                    <div className="space-y-4">
                      {ordersData.orders.map((order) => (
                        <div key={order.order_id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Order #{order.order_number}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(order.created_at)} • {order.status}
                            </p>
                          </div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Start shopping to see your orders here.
                      </p>
                      <div className="mt-6">
                        <Link
                          to="/products"
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Browse Products
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link
                  to="/account/addresses"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">Manage Addresses</h4>
                      <p className="text-sm text-gray-500">
                        {addressesLoading ? 'Loading...' : `${addressesData?.addresses.length || 0} saved addresses`}
                      </p>
                    </div>
                  </div>
                </Link>

                <Link
                  to="/account/wishlist"
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-semibold text-gray-900">View Wishlist</h4>
                      <p className="text-sm text-gray-500">
                        {wishlistLoading ? 'Loading...' : `${wishlistData?.total || 0} saved items`}
                      </p>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_UserDashboard;