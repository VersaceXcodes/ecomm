import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types from the API responses
interface CartItemWithProduct {
  cart_item_id: string;
  user_id: string | null;
  session_id: string | null;
  product_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  product: {
    product_id: string;
    name: string;
    price: number;
    sale_price: number | null;
    brand: string;
    stock_quantity: number;
    images?: Array<{
      image_id: string;
      image_url: string;
      alt_text: string | null;
      is_primary: boolean;
    }>;
  };
  line_total: number;
}

interface CartResponse {
  items: CartItemWithProduct[];
  total_quantity: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
}

interface PromoCodeValidationRequest {
  code: string;
  order_amount: number;
}

interface PromoCodeValidationResponse {
  valid: boolean;
  promo_code?: {
    promo_code_id: string;
    code: string;
    discount_type: string;
    discount_value: number;
  };
  discount_amount?: number;
  final_amount?: number;
}

const UV_FullCart: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Local state
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);

  // Global state access - using individual selectors to avoid infinite loops
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const sessionId = useAppStore(state => state.session_id);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const setCartState = useAppStore(state => state.set_cart_state);

  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  // Auth headers helper
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }
    return headers;
  };

  // Load cart items
  const {
    data: cartData,
    isLoading: loadingCart,
    error: cartError,
    refetch: refetchCart
  } = useQuery<CartResponse>({
    queryKey: ['cart', currentUser?.user_id || sessionId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (!isAuthenticated && sessionId) {
        params.append('session_id', sessionId);
      }

      const response = await axios.get(`${API_BASE_URL}/cart?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    },
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Update cart items quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ cartItemId, quantity }: { cartItemId: string; quantity: number }) => {
      const response = await axios.patch(
        `${API_BASE_URL}/cart/${cartItemId}`,
        { quantity },
        { headers: getAuthHeaders() }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update global state
      setCartState({
        items: data.items || [],
        total_quantity: data.total_quantity || 0,
        subtotal: data.subtotal || 0,
        total: data.total || 0,
        shipping_cost: data.shipping_cost || 0,
        tax_amount: data.tax_amount || 0,
      });
      
      // Invalidate and refetch cart
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Remove cart item
  const removeItemMutation = useMutation({
    mutationFn: async (cartItemId: string) => {
      const response = await axios.delete(`${API_BASE_URL}/cart/${cartItemId}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update global state
      setCartState({
        items: data.items || [],
        total_quantity: data.total_quantity || 0,
        subtotal: data.subtotal || 0,
        total: data.total || 0,
        shipping_cost: data.shipping_cost || 0,
        tax_amount: data.tax_amount || 0,
      });
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Clear entire cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (!isAuthenticated && sessionId) {
        params.append('session_id', sessionId);
      }

      const response = await axios.delete(`${API_BASE_URL}/cart/clear?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      return response.data;
    },
    onSuccess: () => {
      // Reset global cart state
      setCartState({
        items: [],
        total_quantity: 0,
        subtotal: 0,
        total: 0,
        shipping_cost: 0,
        tax_amount: 0,
      });
      
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Validate promo code
  const validatePromoMutation = useMutation({
    mutationFn: async (promoData: PromoCodeValidationRequest) => {
      const response = await axios.post(
        `${API_BASE_URL}/promo-codes/validate`,
        promoData,
        { headers: getAuthHeaders() }
      );
      return response.data;
    },
    onSuccess: (data: PromoCodeValidationResponse) => {
      if (data.valid) {
        setPromoDiscount(data.discount_amount || 0);
        setAppliedPromoCode(data.promo_code?.code || promoCode);
        setPromoError(null);
      } else {
        setPromoError('Invalid or expired promotional code');
        setPromoDiscount(0);
        setAppliedPromoCode(null);
      }
    },
    onError: () => {
      setPromoError('Failed to validate promotional code');
      setPromoDiscount(0);
      setAppliedPromoCode(null);
    },
  });

  // Sync cart data with global state
  useEffect(() => {
    if (cartData) {
      setCartState({
        items: cartData.items || [],
        total_quantity: cartData.total_quantity || 0,
        subtotal: cartData.subtotal || 0,
        total: cartData.total || 0,
        shipping_cost: cartData.shipping_cost || 0,
        tax_amount: cartData.tax_amount || 0,
      });
    }
  }, [cartData, setCartState]);

  // Handlers
  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ cartItemId, quantity: newQuantity });
  };

  const handleRemoveItem = (cartItemId: string) => {
    removeItemMutation.mutate(cartItemId);
  };

  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear your entire cart?')) {
      clearCartMutation.mutate();
    }
  };

  const handlePromoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode.trim()) return;
    
    validatePromoMutation.mutate({
      code: promoCode.trim(),
      order_amount: cartData?.subtotal || 0,
    });
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoDiscount(0);
    setAppliedPromoCode(null);
    setPromoError(null);
  };

  const handleProceedToCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect_to=/checkout/shipping');
    } else {
      navigate('/checkout/shipping');
    }
  };

  // Calculate final total with promo discount
  const finalTotal = (cartData?.total || 0) - promoDiscount;

  return (
    <>
      {loadingCart && (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-lg text-gray-600">Loading your cart...</span>
            </div>
          </div>
        </div>
      )}

      {cartError && (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to load cart</h2>
              <p className="text-gray-600 mb-6">There was an error loading your shopping cart.</p>
              <button
                onClick={() => refetchCart()}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {!loadingCart && !cartError && (!cartData?.items?.length) && (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
            
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 5M7 13l4.5-7m0 0l4.5 7M7 13h10" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
              <Link
                to="/products"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Shopping
              </Link>
            </div>
          </div>
        </div>
      )}

      {!loadingCart && !cartError && cartData && cartData.items && cartData.items.length > 0 && (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4 sm:mb-0">Shopping Cart</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {cartData?.total_quantity || 0} {(cartData?.total_quantity || 0) === 1 ? 'item' : 'items'}
                </span>
                <button
                  onClick={handleClearCart}
                  disabled={clearCartMutation.isPending}
                  className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  Clear Cart
                </button>
              </div>
            </div>

            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              {/* Cart Items */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-medium text-gray-900">Items in your cart</h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {cartData?.items?.map((item) => {
                      const primaryImage = item.product.images?.find(img => img.is_primary) || item.product.images?.[0];
                      const currentPrice = item.product.sale_price || item.product.price;
                      const isOnSale = !!item.product.sale_price;
                      
                      return (
                        <div key={item.cart_item_id} className="p-6">
                          <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                            {/* Product Image */}
                            <div className="flex-shrink-0 w-full sm:w-32">
                              <Link to={`/products/${item.product.product_id}`}>
                                <img
                                  src={primaryImage?.image_url || '/placeholder-image.jpg'}
                                  alt={primaryImage?.alt_text || item.product.name}
                                  className="w-full h-32 sm:w-32 sm:h-32 object-cover rounded-lg border border-gray-200 hover:border-blue-300 transition-colors"
                                />
                              </Link>
                            </div>

                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between">
                                <div className="flex-1">
                                  <Link 
                                    to={`/products/${item.product.product_id}`}
                                    className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors"
                                  >
                                    {item.product.name}
                                  </Link>
                                  <p className="text-sm text-gray-600 mt-1">{item.product.brand}</p>
                                  
                                  {/* Stock Status */}
                                  <div className="mt-2">
                                    {item.product.stock_quantity <= 0 ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        Out of Stock
                                      </span>
                                    ) : item.product.stock_quantity < 5 ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Only {item.product.stock_quantity} left
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        In Stock
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Price and Actions */}
                                <div className="flex flex-col sm:items-end mt-4 sm:mt-0">
                                  <div className="flex items-center space-x-2 mb-4">
                                    <span className="text-lg font-medium text-gray-900">
                                      ${currentPrice.toFixed(2)}
                                    </span>
                                    {isOnSale && (
                                      <span className="text-sm text-gray-500 line-through">
                                        ${item.product.price.toFixed(2)}
                                      </span>
                                    )}
                                  </div>

                                  {/* Quantity Controls */}
                                  <div className="flex items-center space-x-2 mb-4">
                                    <label htmlFor={`quantity-${item.cart_item_id}`} className="sr-only">
                                      Quantity
                                    </label>
                                    <button
                                      onClick={() => handleQuantityChange(item.cart_item_id, item.quantity - 1)}
                                      disabled={item.quantity <= 1 || updateQuantityMutation.isPending}
                                      className="p-1 rounded-md border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                                      </svg>
                                    </button>
                                    <input
                                      id={`quantity-${item.cart_item_id}`}
                                      type="number"
                                      min="1"
                                      max={item.product.stock_quantity}
                                      value={item.quantity}
                                      onChange={(e) => {
                                        const newQuantity = parseInt(e.target.value);
                                        if (newQuantity >= 1 && newQuantity <= item.product.stock_quantity) {
                                          handleQuantityChange(item.cart_item_id, newQuantity);
                                        }
                                      }}
                                      className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    />
                                    <button
                                      onClick={() => handleQuantityChange(item.cart_item_id, item.quantity + 1)}
                                      disabled={item.quantity >= item.product.stock_quantity || updateQuantityMutation.isPending}
                                      className="p-1 rounded-md border border-gray-300 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                      </svg>
                                    </button>
                                  </div>

                                  {/* Line Total */}
                                  <div className="text-lg font-medium text-gray-900 mb-2">
                                    ${item.line_total.toFixed(2)}
                                  </div>

                                  {/* Remove Button */}
                                  <button
                                    onClick={() => handleRemoveItem(item.cart_item_id)}
                                    disabled={removeItemMutation.isPending}
                                    className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
                                  >
                                    {removeItemMutation.isPending ? 'Removing...' : 'Remove'}
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Continue Shopping */}
                <div className="mt-6">
                  <Link
                    to="/products"
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Continue Shopping
                  </Link>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-4 mt-8 lg:mt-0">
                <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                  <h2 className="text-lg font-medium text-gray-900 mb-6">Order Summary</h2>

                  {/* Promo Code */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Promotional Code</h3>
                    
                    {appliedPromoCode ? (
                      <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">{appliedPromoCode}</span>
                        </div>
                        <button
                          onClick={handleRemovePromo}
                          className="text-green-600 hover:text-green-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handlePromoSubmit} className="flex space-x-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => {
                            setPromoCode(e.target.value);
                            setPromoError(null);
                          }}
                          placeholder="Enter code"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={!promoCode.trim() || validatePromoMutation.isPending}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {validatePromoMutation.isPending ? 'Applying...' : 'Apply'}
                        </button>
                      </form>
                    )}

                    {promoError && (
                      <p className="mt-2 text-sm text-red-600">{promoError}</p>
                    )}
                  </div>

                  {/* Cost Breakdown */}
                  <div className="space-y-3 border-t border-gray-200 pt-6">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Subtotal</span>
                      <span>${(cartData?.subtotal || 0).toFixed(2)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Shipping</span>
                      <span>
                        {(cartData?.shipping_cost || 0) === 0 ? 'Free' : `$${(cartData?.shipping_cost || 0).toFixed(2)}`}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tax</span>
                      <span>${(cartData?.tax_amount || 0).toFixed(2)}</span>
                    </div>

                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Promo Discount</span>
                        <span>-${promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-medium text-gray-900">
                        <span>Total</span>
                        <span>${finalTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Checkout Button */}
                  <div className="mt-6">
                    <button
                      onClick={handleProceedToCheckout}
                      disabled={(cartData?.items?.length || 0) === 0}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Proceed to Checkout
                    </button>
                    
                    {!isAuthenticated && (
                      <p className="mt-3 text-xs text-gray-500 text-center">
                        You'll be asked to sign in or continue as guest
                      </p>
                    )}
                  </div>

                  {/* Security Badges */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Secure Checkout
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Money Back Guarantee
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_FullCart;