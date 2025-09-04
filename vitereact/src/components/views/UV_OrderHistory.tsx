import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types based on Zod schemas
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

interface OrdersResponse {
  orders: OrderWithItems[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface OrderFilters {
  status?: string;
  date_from?: string;
  date_to?: string;
  search_query?: string;
}

interface Pagination {
  limit: number;
  offset: number;
  total: number;
  has_more: boolean;
}

const UV_OrderHistory: React.FC = () => {
  // Global state access - individual selectors to avoid infinite loops
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  // Removed unused currentUser
  const setCartItems = useAppStore(state => state.set_cart_items);
  const setCartLoading = useAppStore(state => state.set_cart_loading);

  // Local state
  const [filters, setFilters] = useState<OrderFilters>({});
  const [pagination, setPagination] = useState<Pagination>({
    limit: 20,
    offset: 0,
    total: 0,
    has_more: false
  });
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<{ [order_id: string]: OrderItem[] }>({});

  // Removed unused queryClient

  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  // Fetch orders
  const {
    data: ordersData,
    isLoading: loadingOrders,
    error: ordersError
  } = useQuery({
    queryKey: ['orders', filters, pagination.limit, pagination.offset],
    queryFn: async (): Promise<OrdersResponse> => {
      const params = new URLSearchParams();
      
      if (filters.status) params.append('status', filters.status);
      if (filters.search_query) params.append('search_query', filters.search_query);
      params.append('limit', pagination.limit.toString());
      params.append('offset', pagination.offset.toString());
      params.append('sort_by', 'created_at');
      params.append('sort_order', 'desc');

      const response = await axios.get(`${API_BASE_URL}/orders?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      return response.data;
    },
    enabled: !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Fetch order details
  const fetchOrderDetails = async (orderId: string): Promise<OrderWithItems> => {
    const response = await axios.get(`${API_BASE_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    return response.data;
  };

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: async (orderItems: OrderItem[]) => {
      setCartLoading(true);
      
      const cartPromises = orderItems.map(item => 
        axios.post(`${API_BASE_URL}/cart`, {
          product_id: item.product_id,
          quantity: item.quantity
        }, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      await Promise.all(cartPromises);
      
      // Fetch updated cart
      const cartResponse = await axios.get(`${API_BASE_URL}/cart`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      return cartResponse.data;
    },
    onSuccess: (cartData) => {
      setCartItems(cartData.items || []);
      setCartLoading(false);
      // Show success notification could be added here
    },
    onError: (error) => {
      setCartLoading(false);
      console.error('Reorder failed:', error);
    }
  });

  // Update pagination when orders data changes
  useEffect(() => {
    if (ordersData) {
      setPagination(prev => ({
        ...prev,
        total: ordersData.total,
        has_more: ordersData.has_more
      }));
    }
  }, [ordersData]);

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<OrderFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, offset: 0 }));
  };

  // Handle pagination
  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  // Handle order expansion
  const handleOrderExpand = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);
    
    if (!orderItems[orderId]) {
      try {
        const orderDetails = await fetchOrderDetails(orderId);
        setOrderItems(prev => ({
          ...prev,
          [orderId]: orderDetails.order_items
        }));
      } catch (error) {
        console.error('Failed to load order details:', error);
      }
    }
  };

  // Handle reorder
  const handleReorder = (items: OrderItem[]) => {
    reorderMutation.mutate(items);
  };

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const orders = ordersData?.orders || [];

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Order History</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Track and manage your orders
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                  Order Status
                </label>
                <select
                  id="status-filter"
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange({ status: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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

              <div>
                <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-2">
                  From Date
                </label>
                <input
                  type="date"
                  id="date-from"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange({ date_from: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-2">
                  To Date
                </label>
                <input
                  type="date"
                  id="date-to"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange({ date_to: e.target.value || undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search Orders
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by order number or product name..."
                value={filters.search_query || ''}
                onChange={(e) => handleFilterChange({ search_query: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Loading State */}
          {loadingOrders && (
            <div className="bg-white rounded-lg shadow p-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {ordersError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
                  <p className="mt-1 text-sm text-red-700">Please try again later.</p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loadingOrders && orders.length === 0 && (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">You haven't placed any orders yet.</p>
              <div className="mt-6">
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Start Shopping
                </Link>
              </div>
            </div>
          )}

          {/* Orders List */}
          {!loadingOrders && orders.length > 0 && (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.order_id} className="bg-white rounded-lg shadow overflow-hidden">
                  {/* Order Header */}
                  <div className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-lg font-medium text-gray-900">
                            Order #{order.order_number}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:space-x-6">
                          <p className="text-sm text-gray-500">
                            Placed on {formatDate(order.created_at)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Total: {formatCurrency(order.total_amount, order.currency)}
                          </p>
                          {order.tracking_number && (
                            <p className="text-sm text-gray-500">
                              Tracking: {order.tracking_number}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-4 sm:mt-0 flex space-x-3">
                        <button
                          onClick={() => handleOrderExpand(order.order_id)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {expandedOrderId === order.order_id ? 'Hide Details' : 'View Details'}
                        </button>
                        <button
                          onClick={() => {
                            const items = orderItems[order.order_id] || order.order_items || [];
                            if (items.length > 0) {
                              handleReorder(items);
                            }
                          }}
                          disabled={reorderMutation.isPending}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {reorderMutation.isPending ? 'Adding...' : 'Reorder'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Order Details */}
                  {expandedOrderId === order.order_id && (
                    <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order Items */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Order Items</h4>
                          <div className="space-y-3">
                            {(orderItems[order.order_id] || order.order_items || []).map((item) => (
                              <div key={item.order_item_id} className="flex items-center space-x-3 bg-white p-3 rounded-md">
                                {item.product_image_url && (
                                  <img
                                    src={item.product_image_url}
                                    alt={item.product_name}
                                    className="h-12 w-12 rounded-md object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <Link
                                    to={`/products/${item.product_id}`}
                                    className="text-sm font-medium text-gray-900 hover:text-blue-600 truncate block"
                                  >
                                    {item.product_name}
                                  </Link>
                                  <p className="text-sm text-gray-500">{item.product_brand}</p>
                                  <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-sm font-medium text-gray-900">
                                  {formatCurrency(item.line_total)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-900 mb-3">Order Summary</h4>
                          <div className="bg-white p-4 rounded-md space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Subtotal:</span>
                              <span className="text-gray-900">{formatCurrency(order.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Shipping:</span>
                              <span className="text-gray-900">{formatCurrency(order.shipping_cost)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Tax:</span>
                              <span className="text-gray-900">{formatCurrency(order.tax_amount)}</span>
                            </div>
                            {order.discount_amount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Discount:</span>
                                <span className="text-green-600">-{formatCurrency(order.discount_amount)}</span>
                              </div>
                            )}
                            <div className="border-t border-gray-200 pt-2">
                              <div className="flex justify-between text-base font-medium">
                                <span className="text-gray-900">Total:</span>
                                <span className="text-gray-900">{formatCurrency(order.total_amount)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Additional Info */}
                          <div className="mt-4 space-y-2 text-sm">
                            <p><span className="font-medium">Payment Method:</span> {order.payment_method}</p>
                            <p><span className="font-medium">Shipping Method:</span> {order.shipping_method}</p>
                            {order.estimated_delivery_date && (
                              <p><span className="font-medium">Estimated Delivery:</span> {formatDate(order.estimated_delivery_date)}</p>
                            )}
                            {order.delivered_at && (
                              <p><span className="font-medium">Delivered:</span> {formatDate(order.delivered_at)}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loadingOrders && pagination.total > pagination.limit && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                  disabled={pagination.offset === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                  disabled={!pagination.has_more}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{pagination.offset + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(pagination.offset + pagination.limit, pagination.total)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{pagination.total}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(Math.max(0, pagination.offset - pagination.limit))}
                      disabled={pagination.offset === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.offset + pagination.limit)}
                      disabled={!pagination.has_more}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_OrderHistory;