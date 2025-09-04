import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types based on Zod schemas
interface Order {
  order_id: string;
  order_number: string;
  user_id?: string;
  guest_email?: string;
  status: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  payment_status: string;
  shipping_address_id: string;
  billing_address_id: string;
  shipping_method: string;
  tracking_number?: string;
  estimated_delivery_date?: string;
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
  product_image_url?: string;
  product_price: number;
  sale_price?: number;
  quantity: number;
  line_total: number;
  created_at: string;
}

interface OrderWithItems extends Order {
  order_items: OrderItem[];
  shipping_address?: any;
  billing_address?: any;
}

interface Product {
  product_id: string;
  name: string;
  price: number;
  sale_price?: number;
  brand: string;
  images?: Array<{ image_url: string; is_primary: boolean }>;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

const UV_OrderConfirmation: React.FC = () => {
  const { order_id } = useParams<{ order_id: string }>();
  const navigate = useNavigate();
  
  // Individual Zustand selectors - CRITICAL: No object destructuring
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const clearCartState = useAppStore(state => state.clear_cart_state);

  // Clear cart after successful order
  useEffect(() => {
    clearCartState();
  }, [clearCartState]);

  // Redirect if no order_id
  useEffect(() => {
    if (!order_id) {
      navigate('/', { replace: true });
    }
  }, [order_id, navigate]);

  // Fetch order details
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError
  } = useQuery<OrderWithItems>({
    queryKey: ['order', order_id],
    queryFn: async () => {
      if (!order_id) throw new Error('Order ID is required');
      
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/orders/${order_id}`,
        {
          headers: currentUser ? {
            'Authorization': `Bearer ${useAppStore.getState().authentication_state.auth_token}`
          } : undefined
        }
      );
      return response.data;
    },
    enabled: !!order_id,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Fetch recommended products
  const {
    data: recommendedData
  } = useQuery<ProductsResponse>({
    queryKey: ['recommended-products'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/products`,
        {
          params: {
            is_active: true,
            is_featured: true,
            limit: 3
          }
        }
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  // Calculate estimated delivery
  const getEstimatedDelivery = (): string => {
    if (orderData?.estimated_delivery_date) {
      return formatDate(orderData.estimated_delivery_date);
    }
    
    // Default to 5-7 business days from order date
    const orderDate = new Date(orderData?.created_at || Date.now());
    const estimatedDate = new Date(orderDate);
    estimatedDate.setDate(estimatedDate.getDate() + 7);
    return formatDate(estimatedDate.toISOString());
  };

  if (orderLoading) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your order details...</p>
          </div>
        </div>
      </>
    );
  }

  if (orderError || !orderData) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
            <p className="text-gray-600 mb-6">
              We couldn't find the order you're looking for. Please check your order number or contact customer service.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Success Header */}
        <div className="bg-gradient-to-r from-green-400 to-blue-500 py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="text-white text-6xl mb-4 animate-bounce">🎉</div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Thank you for your order!
            </h1>
            <p className="text-xl text-white opacity-90 mb-6">
              Your order has been confirmed and is being processed
            </p>
            <div className="bg-white bg-opacity-20 rounded-lg p-4 inline-block">
              <p className="text-white font-semibold">Order Number</p>
              <p className="text-2xl font-bold text-white">{orderData.order_number}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Order Details</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Order Number:</span> {orderData.order_number}</p>
                  <p><span className="font-medium">Order Date:</span> {formatDate(orderData.created_at)}</p>
                  <p><span className="font-medium">Status:</span> 
                    <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      {orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                    </span>
                  </p>
                  <p><span className="font-medium">Payment Method:</span> {orderData.payment_method}</p>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Delivery Information</h3>
                <div className="space-y-1 text-sm text-gray-600">
                  <p><span className="font-medium">Shipping Method:</span> {orderData.shipping_method}</p>
                  <p><span className="font-medium">Estimated Delivery:</span> {getEstimatedDelivery()}</p>
                  {orderData.tracking_number && (
                    <p><span className="font-medium">Tracking Number:</span> {orderData.tracking_number}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {orderData.order_items.map((item) => (
                  <div key={item.order_item_id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-md"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No Image</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                      <p className="text-sm text-gray-600">{item.product_brand}</p>
                      <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-medium text-gray-900">Qty: {item.quantity}</p>
                      <p className="text-sm text-gray-600">
                        {formatCurrency(item.sale_price || item.product_price)} each
                      </p>
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(item.line_total)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Totals */}
            <div className="border-t pt-6 mt-6">
              <div className="space-y-2 text-right">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="text-gray-900">{formatCurrency(orderData.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping:</span>
                  <span className="text-gray-900">{formatCurrency(orderData.shipping_cost)}</span>
                </div>
                {orderData.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="text-gray-900">{formatCurrency(orderData.tax_amount)}</span>
                  </div>
                )}
                {orderData.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-{formatCurrency(orderData.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total:</span>
                  <span className="text-gray-900">{formatCurrency(orderData.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What's Next?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Confirmation</h3>
                    <p className="text-sm text-gray-600">
                      We've sent a confirmation email to {orderData.guest_email || currentUser?.email}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Order Processing</h3>
                    <p className="text-sm text-gray-600">
                      Your order is being prepared and will be shipped within 1-2 business days
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Tracking Information</h3>
                    <p className="text-sm text-gray-600">
                      You'll receive tracking details once your order ships
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {!isAuthenticated && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 mb-2">Create an Account</h3>
                    <p className="text-sm text-blue-700 mb-3">
                      Create an account to track your orders, save addresses, and enjoy faster checkout
                    </p>
                    <Link
                      to="/register"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      Create Account
                    </Link>
                  </div>
                )}
                
                {isAuthenticated && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-900 mb-2">Track Your Order</h3>
                    <p className="text-sm text-green-700 mb-3">
                      View your order status and tracking information in your account
                    </p>
                    <Link
                      to="/account/orders"
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      View Orders
                    </Link>
                  </div>
                )}
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Need Help?</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Have questions about your order? Our customer service team is here to help
                  </p>
                  <Link
                    to="/contact"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    Contact Support
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Products */}
          {recommendedData?.products && recommendedData.products.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">You Might Also Like</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {recommendedData.products.map((product) => (
                  <Link
                    key={product.product_id}
                    to={`/products/${product.product_id}`}
                    className="group border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images.find(img => img.is_primary)?.image_url || product.images[0].image_url}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-md mb-4 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    
                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                    <div className="flex items-center space-x-2">
                      {product.sale_price ? (
                        <>
                          <span className="font-bold text-red-600">{formatCurrency(product.sale_price)}</span>
                          <span className="text-sm text-gray-500 line-through">{formatCurrency(product.price)}</span>
                        </>
                      ) : (
                        <span className="font-bold text-gray-900">{formatCurrency(product.price)}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="text-center space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
            <Link
              to="/products"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
            >
              Continue Shopping
            </Link>
            
            {isAuthenticated ? (
              <Link
                to="/account"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
              >
                View Account
              </Link>
            ) : (
              <Link
                to="/register"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_OrderConfirmation;