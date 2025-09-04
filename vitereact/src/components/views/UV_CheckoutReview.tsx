import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for API responses
interface OrderItem {
  product_id: string;
  product_name: string;
  product_brand: string;
  product_sku: string;
  product_image_url: string | null;
  product_price: number;
  sale_price: number | null;
  quantity: number;
  line_total: number;
}

interface CreateOrderRequest {
  order_number: string;
  user_id?: string;
  guest_email?: string;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  currency: string;
  payment_method: string;
  shipping_address_id: string;
  billing_address_id: string;
  shipping_method: string;
  notes?: string;
  promo_code?: string;
  order_items: OrderItem[];
}

interface CreateOrderResponse {
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
  created_at: string;
}

interface CartValidationResponse {
  items: Array<{
    cart_item_id: string;
    product_id: string;
    quantity: number;
    product: {
      product_id: string;
      name: string;
      price: number;
      sale_price: number | null;
      brand: string;
      stock_quantity: number;
      is_active: boolean;
    };
    line_total: number;
  }>;
  total_quantity: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
}

const UV_CheckoutReview: React.FC = () => {
  const navigate = useNavigate();
  
  // Global state access - individual selectors to avoid infinite loops
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const sessionId = useAppStore(state => state.session_id);
  
  // Local state management
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [orderSummary, setOrderSummary] = useState({
    subtotal: 0,
    shipping_cost: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0
  });
  
  // Mock data for checkout flow (in real app, this would come from previous steps)
  const [shippingAddress] = useState({
    address_id: 'addr_001',
    first_name: 'John',
    last_name: 'Doe',
    street_address_1: '123 Main St',
    city: 'New York',
    state_province: 'NY',
    postal_code: '10001',
    country: 'United States',
    phone: '+1-555-0123'
  });
  
  const [billingAddress] = useState({
    address_id: 'addr_002',
    first_name: 'John',
    last_name: 'Doe',
    street_address_1: '123 Main St',
    city: 'New York',
    state_province: 'NY',
    postal_code: '10001',
    country: 'United States'
  });
  
  const [shippingMethod] = useState({
    shipping_method_id: 'ship_001',
    name: 'Standard Shipping',
    description: '5-7 business days',
    cost: 9.99,
    estimated_days_min: 5,
    estimated_days_max: 7
  });
  
  const [paymentMethodSummary] = useState({
    type: 'credit_card',
    display_info: '**** **** **** 1234 (Visa)'
  });

  // Generate order number
  const generateOrderNumber = (): string => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `ORD-${timestamp}-${random}`.toUpperCase();
  };

  // API call for cart validation
  const { data: cartValidation, isLoading: isValidating } = useQuery<CartValidationResponse>({
    queryKey: ['cart-validation', currentUser?.user_id, sessionId],
    queryFn: async () => {
      const params = currentUser?.user_id ? {} : { session_id: sessionId };
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/cart`, {
        params,
        headers
      });
      
      return response.data;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Update order summary when cart validation loads
  useEffect(() => {
    if (cartValidation) {
      setOrderSummary({
        subtotal: cartValidation.subtotal,
        shipping_cost: cartValidation.shipping_cost || shippingMethod.cost,
        tax_amount: cartValidation.tax_amount,
        discount_amount: 0, // Would come from promo codes
        total_amount: cartValidation.subtotal + (cartValidation.shipping_cost || shippingMethod.cost) + cartValidation.tax_amount
      });
    }
  }, [cartValidation, shippingMethod.cost]);

  // Order creation mutation
  const createOrderMutation = useMutation<CreateOrderResponse, Error, CreateOrderRequest>({
    mutationFn: async (orderData: CreateOrderRequest) => {
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {};
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/orders`,
        orderData,
        { headers }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      // Navigate to confirmation page with order ID
      navigate(`/checkout/confirmation?order_id=${data.order_id}`);
    },
    onError: (error) => {
      console.error('Order creation failed:', error);
      // Error handling would show user feedback
    }
  });

  // Handle order submission
  const handlePlaceOrder = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to continue.');
      return;
    }

    if (!cartValidation || cartValidation.items.length === 0) {
      alert('Your cart is empty. Please add items before placing an order.');
      return;
    }

    const orderItems: OrderItem[] = cartValidation.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product.name,
      product_brand: item.product.brand,
      product_sku: item.product_id, // Using product_id as SKU for now
      product_image_url: null, // Would need to get from product images
      product_price: item.product.price,
      sale_price: item.product.sale_price,
      quantity: item.quantity,
      line_total: item.line_total
    }));

    const orderData: CreateOrderRequest = {
      order_number: generateOrderNumber(),
      user_id: currentUser?.user_id,
      guest_email: currentUser ? undefined : 'guest@example.com', // Would come from guest checkout
      subtotal: orderSummary.subtotal,
      shipping_cost: orderSummary.shipping_cost,
      tax_amount: orderSummary.tax_amount,
      discount_amount: orderSummary.discount_amount,
      total_amount: orderSummary.total_amount,
      currency: 'USD',
      payment_method: paymentMethodSummary.type,
      shipping_address_id: shippingAddress.address_id,
      billing_address_id: billingAddress.address_id,
      shipping_method: shippingMethod.name,
      order_items: orderItems
    };

    createOrderMutation.mutate(orderData);
  };

  const isLoading = isValidating || createOrderMutation.isPending;

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Progress indicator */}
        <div className="bg-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Shipping</span>
              </div>
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Payment</span>
              </div>
              <div className="flex-1 h-px bg-gray-200"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">3</span>
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Review</span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            {/* Main content */}
            <div className="lg:col-span-8">
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h1 className="text-2xl font-bold text-gray-900">Review Your Order</h1>
                  <p className="mt-1 text-sm text-gray-600">Please review your order details before completing your purchase</p>
                </div>

                {/* Order Items */}
                <div className="px-6 py-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Order Items</h2>
                  
                  {isValidating ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : cartValidation?.items.length ? (
                    <div className="space-y-4">
                      {cartValidation.items.map((item) => (
                        <div key={item.cart_item_id} className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg">
                          <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900">{item.product.name}</h3>
                            <p className="text-sm text-gray-500">{item.product.brand}</p>
                            <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              ${(item.product.sale_price || item.product.price).toFixed(2)}
                            </p>
                            {item.product.sale_price && (
                              <p className="text-sm text-gray-500 line-through">${item.product.price.toFixed(2)}</p>
                            )}
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              Total: ${item.line_total.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No items in cart</p>
                      <Link to="/products" className="text-blue-600 hover:text-blue-500 text-sm">
                        Continue Shopping
                      </Link>
                    </div>
                  )}
                </div>

                {/* Shipping Address */}
                <div className="px-6 py-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Shipping Address</h2>
                    <Link 
                      to="/checkout/shipping" 
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{shippingAddress.first_name} {shippingAddress.last_name}</p>
                    <p className="text-gray-600">{shippingAddress.street_address_1}</p>
                    <p className="text-gray-600">
                      {shippingAddress.city}, {shippingAddress.state_province} {shippingAddress.postal_code}
                    </p>
                    <p className="text-gray-600">{shippingAddress.country}</p>
                    {shippingAddress.phone && (
                      <p className="text-gray-600">{shippingAddress.phone}</p>
                    )}
                  </div>
                </div>

                {/* Billing Address */}
                <div className="px-6 py-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Billing Address</h2>
                    <Link 
                      to="/checkout/payment" 
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{billingAddress.first_name} {billingAddress.last_name}</p>
                    <p className="text-gray-600">{billingAddress.street_address_1}</p>
                    <p className="text-gray-600">
                      {billingAddress.city}, {billingAddress.state_province} {billingAddress.postal_code}
                    </p>
                    <p className="text-gray-600">{billingAddress.country}</p>
                  </div>
                </div>

                {/* Shipping Method */}
                <div className="px-6 py-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Shipping Method</h2>
                    <Link 
                      to="/checkout/shipping" 
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="font-medium text-gray-900">{shippingMethod.name}</p>
                    <p className="text-gray-600">{shippingMethod.description}</p>
                    <p className="text-gray-600">${shippingMethod.cost.toFixed(2)}</p>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="px-6 py-6 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Payment Method</h2>
                    <Link 
                      to="/checkout/payment" 
                      className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                    >
                      Edit
                    </Link>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
                    <svg className="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <div>
                      <p className="font-medium text-gray-900">Credit Card</p>
                      <p className="text-gray-600">{paymentMethodSummary.display_info}</p>
                    </div>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="px-6 py-6 border-t border-gray-200">
                  <div className="flex items-start">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                    />
                    <label htmlFor="terms" className="ml-3 text-sm text-gray-600">
                      I agree to the{' '}
                      <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                        Terms and Conditions
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Order summary sidebar */}
            <div className="lg:col-span-4 mt-8 lg:mt-0">
              <div className="bg-white shadow rounded-lg sticky top-4">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">Order Summary</h2>
                </div>
                
                <div className="px-6 py-4 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">${orderSummary.subtotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-gray-900">${orderSummary.shipping_cost.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium text-gray-900">${orderSummary.tax_amount.toFixed(2)}</span>
                  </div>
                  
                  {orderSummary.discount_amount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">-${orderSummary.discount_amount.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-medium">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">${orderSummary.total_amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200">
                  <button
                    onClick={handlePlaceOrder}
                    disabled={!termsAccepted || isLoading}
                    className="w-full bg-blue-600 border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {createOrderMutation.isPending ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Order...
                      </span>
                    ) : (
                      'Place Order'
                    )}
                  </button>
                  
                  {createOrderMutation.isError && (
                    <div className="mt-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md text-sm">
                      Order creation failed. Please try again.
                    </div>
                  )}
                </div>

                {/* Security badges */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      SSL Secured
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Protected
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_CheckoutReview;