import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';

// Types from Zod schemas
interface Order {
  order_id: string;
  order_number: string;
  user_id: string | null;
  guest_email: string | null;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_transaction_id: string | null;
  shipping_address_id: string;
  billing_address_id: string;
  shipping_method: string;
  tracking_number: string | null;
  estimated_delivery_date: string | null;
  delivered_at: string | null;
  notes: string | null;
  promo_code: string | null;
  created_at: string;
  updated_at: string;
}

interface OrderItem {
  order_item_id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_brand: string;
  product_sku: string;
  product_image_url: string | null;
  product_price: number;
  sale_price: number | null;
  quantity: number;
  line_total: number;
  created_at: string;
}

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  shipping_address?: any;
  billing_address?: any;
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

interface SearchOrdersInput {
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  search_query?: string;
  date_from?: string;
  date_to?: string;
  limit: number;
  offset: number;
  sort_by: 'created_at' | 'total_amount' | 'status';
  sort_order: 'asc' | 'desc';
}

interface UpdateOrderInput {
  order_id: string;
  status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  tracking_number?: string | null;
  estimated_delivery_date?: string | null;
  notes?: string | null;
}

const UV_AdminOrders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // Global state access - individual selectors to avoid infinite loops
  const adminToken = useAppStore(state => state.admin_state.admin_token);
  const isAdminAuthenticated = useAppStore(state => state.admin_state.is_authenticated);
  const currentAdmin = useAppStore(state => state.admin_state.current_admin);

  // Local state
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [orderStatusUpdate, setOrderStatusUpdate] = useState<UpdateOrderInput | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);

  // Filter state synchronized with URL params
  const [orderFilters, setOrderFilters] = useState<SearchOrdersInput>({
    status: searchParams.get('status') as any || undefined,
    payment_status: searchParams.get('payment_status') as any || undefined,
    search_query: searchParams.get('search_query') || undefined,
    date_from: searchParams.get('date_from') || undefined,
    date_to: searchParams.get('date_to') || undefined,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    sort_by: 'created_at',
    sort_order: 'desc'
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (orderFilters.status) params.set('status', orderFilters.status);
    if (orderFilters.payment_status) params.set('payment_status', orderFilters.payment_status);
    if (orderFilters.search_query) params.set('search_query', orderFilters.search_query);
    if (orderFilters.date_from) params.set('date_from', orderFilters.date_from);
    if (orderFilters.date_to) params.set('date_to', orderFilters.date_to);
    
    setSearchParams(params);
  }, [orderFilters, setSearchParams]);

  // API functions
  const fetchAdminOrders = async (filters: SearchOrdersInput): Promise<{ orders: OrderWithItems[]; total: number }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/orders?${params}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    return response.data;
  };

  const fetchOrderDetails = async (orderId: string): Promise<OrderWithItems> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/orders/${orderId}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    return response.data;
  };

  const updateOrderStatus = async (updateData: UpdateOrderInput): Promise<OrderWithItems> => {
    const response = await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/orders/${updateData.order_id}`,
      updateData,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  };

  // React Query hooks
  const {
    data: ordersData,
    isLoading: loadingOrders,
    error: ordersError,
    refetch: refetchOrders
  } = useQuery({
    queryKey: ['admin-orders', orderFilters],
    queryFn: () => fetchAdminOrders(orderFilters),
    enabled: isAdminAuthenticated && !!adminToken,
    staleTime: 30000, // 30 seconds
  });

  const {
    data: selectedOrder,
    isLoading: loadingOrderDetails
  } = useQuery({
    queryKey: ['admin-order-detail', selectedOrderId],
    queryFn: () => fetchOrderDetails(selectedOrderId!),
    enabled: !!selectedOrderId && isAdminAuthenticated && !!adminToken,
  });

  const updateOrderMutation = useMutation({
    mutationFn: updateOrderStatus,
    onSuccess: (updatedOrder) => {
      // Update queries
      queryClient.setQueryData(['admin-order-detail', updatedOrder.order_id], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      setEditingOrderId(null);
      setOrderStatusUpdate(null);
    },
    onError: (error) => {
      console.error('Failed to update order:', error);
    },
  });

  // Event handlers
  const handleFilterChange = (field: keyof SearchOrdersInput, value: any) => {
    setOrderFilters(prev => ({
      ...prev,
      [field]: value,
      offset: 0 // Reset to first page when filtering
    }));
    setCurrentPage(1);
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowOrderDetail(true);
  };

  const handleStatusEdit = (order: Order) => {
    setEditingOrderId(order.order_id);
    setOrderStatusUpdate({
      order_id: order.order_id,
      status: order.status,
      payment_status: order.payment_status,
      tracking_number: order.tracking_number || '',
      estimated_delivery_date: order.estimated_delivery_date || '',
      notes: order.notes || ''
    });
  };

  const handleStatusUpdate = () => {
    if (orderStatusUpdate) {
      updateOrderMutation.mutate(orderStatusUpdate);
    }
  };

  const handleCancelEdit = () => {
    setEditingOrderId(null);
    setOrderStatusUpdate(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setOrderFilters(prev => ({
      ...prev,
      offset: (page - 1) * pageSize
    }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Redirect if not authenticated
  if (!isAdminAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You need to be logged in as an administrator to access this page.</p>
            <Link
              to="/admin/login"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Admin Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <h1 className="text-xl font-semibold text-gray-900">Order Management</h1>
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">Welcome, {currentAdmin?.username}</span>
                <Link
                  to="/admin/products"
                  className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Products
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Filters Section */}
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Filter Orders</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Search */}
                  <div>
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                      Search
                    </label>
                    <input
                      type="text"
                      id="search"
                      placeholder="Order number or email..."
                      value={orderFilters.search_query || ''}
                      onChange={(e) => handleFilterChange('search_query', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                      Order Status
                    </label>
                    <select
                      id="status"
                      value={orderFilters.status || ''}
                      onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  {/* Payment Status Filter */}
                  <div>
                    <label htmlFor="payment_status" className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Status
                    </label>
                    <select
                      id="payment_status"
                      value={orderFilters.payment_status || ''}
                      onChange={(e) => handleFilterChange('payment_status', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Payment Statuses</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>

                  {/* Date From */}
                  <div>
                    <label htmlFor="date_from" className="block text-sm font-medium text-gray-700 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      id="date_from"
                      value={orderFilters.date_from || ''}
                      onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Date To */}
                  <div>
                    <label htmlFor="date_to" className="block text-sm font-medium text-gray-700 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      id="date_to"
                      value={orderFilters.date_to || ''}
                      onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <button
                      onClick={() => {
                        setOrderFilters({
                          limit: pageSize,
                          offset: 0,
                          sort_by: 'created_at',
                          sort_order: 'desc'
                        });
                        setCurrentPage(1);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-gray-900">
                    Orders {ordersData && `(${ordersData.total} total)`}
                  </h2>
                  <button
                    onClick={() => refetchOrders()}
                    disabled={loadingOrders}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loadingOrders ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
              </div>

              {loadingOrders ? (
                <div className="px-6 py-8 text-center">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading orders...
                  </div>
                </div>
              ) : ordersError ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-red-600">Error loading orders. Please try again.</p>
                </div>
              ) : !ordersData?.orders || ordersData.orders.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No orders found matching your criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {ordersData.orders.map((order) => (
                        <tr key={order.order_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {order.order_number}
                              </div>
                              <div className="text-sm text-gray-500">
                                ID: {order.order_id.slice(0, 8)}...
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {order.guest_email || 'Registered User'}
                            </div>
                            {order.user_id && (
                              <div className="text-sm text-gray-500">
                                User ID: {order.user_id.slice(0, 8)}...
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingOrderId === order.order_id ? (
                              <select
                                value={orderStatusUpdate?.status || order.status}
                                onChange={(e) => setOrderStatusUpdate(prev => prev ? { ...prev, status: e.target.value as any } : null)}
                                className="text-xs px-2 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                                {order.status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {editingOrderId === order.order_id ? (
                              <select
                                value={orderStatusUpdate?.payment_status || order.payment_status}
                                onChange={(e) => setOrderStatusUpdate(prev => prev ? { ...prev, payment_status: e.target.value as any } : null)}
                                className="text-xs px-2 py-1 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                <option value="pending">Pending</option>
                                <option value="paid">Paid</option>
                                <option value="failed">Failed</option>
                                <option value="refunded">Refunded</option>
                              </select>
                            ) : (
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.payment_status)}`}>
                                {order.payment_status}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(order.total_amount)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(order.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {editingOrderId === order.order_id ? (
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleStatusUpdate}
                                  disabled={updateOrderMutation.isPending}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                >
                                  {updateOrderMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="text-gray-600 hover:text-gray-900"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => handleOrderSelect(order.order_id)}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleStatusEdit(order)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Edit
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {ordersData && ordersData.total > pageSize && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, ordersData.total)} of {ordersData.total} results
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      <span className="px-3 py-2 text-sm text-gray-700">
                        Page {currentPage} of {Math.ceil(ordersData.total / pageSize)}
                      </span>
                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(ordersData.total / pageSize)}
                        className="px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Order Details - {selectedOrder.order_number}
                </h3>
                <button
                  onClick={() => {
                    setShowOrderDetail(false);
                    setSelectedOrderId(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>

              {loadingOrderDetails ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading order details...
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Order Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Order Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Order ID:</span>
                        <span className="text-gray-900">{selectedOrder.order_id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(selectedOrder.status)}`}>
                          {selectedOrder.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Status:</span>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                          {selectedOrder.payment_status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total:</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(selectedOrder.total_amount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Method:</span>
                        <span className="text-gray-900">{selectedOrder.payment_method}</span>
                      </div>
                      {selectedOrder.tracking_number && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tracking:</span>
                          <span className="text-gray-900">{selectedOrder.tracking_number}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Created:</span>
                        <span className="text-gray-900">{formatDate(selectedOrder.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Order Items</h4>
                    <div className="space-y-3">
                      {selectedOrder.order_items?.map((item) => (
                        <div key={item.order_item_id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                          {item.product_image_url && (
                            <img
                              src={item.product_image_url}
                              alt={item.product_name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                            <div className="text-sm text-gray-500">{item.product_brand}</div>
                            <div className="text-sm text-gray-500">SKU: {item.product_sku}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency(item.sale_price || item.product_price)}
                            </div>
                            <div className="text-sm text-gray-500">Qty: {item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_AdminOrders;