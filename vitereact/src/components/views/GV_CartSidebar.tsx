import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for API responses
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
    image_url?: string;
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

interface UpdateCartItemRequest {
  quantity: number;
}

const GV_CartSidebar: React.FC = () => {
  // Local state
  const [updating_item_id, setUpdatingItemId] = useState<string | null>(null);
  const [error_message, setErrorMessage] = useState<string | null>(null);

  // Global state - using individual selectors to prevent infinite re-renders
  const cart_sidebar_open = useAppStore(state => state.ui_state.cart_sidebar_open);
  const current_breakpoint = useAppStore(state => state.ui_state.current_breakpoint);
  const cart_items = useAppStore(state => state.cart_state.items);
  const cart_subtotal = useAppStore(state => state.cart_state.subtotal);
  const cart_total = useAppStore(state => state.cart_state.total);
  const total_quantity = useAppStore(state => state.cart_state.total_quantity);
  const is_loading = useAppStore(state => state.cart_state.is_loading);
  const current_user = useAppStore(state => state.authentication_state.current_user);
  const auth_token = useAppStore(state => state.authentication_state.auth_token);
  const session_id = useAppStore(state => state.session_id);
  
  // Global state actions
  const toggle_cart_sidebar = useAppStore(state => state.toggle_cart_sidebar);
  const set_cart_items = useAppStore(state => state.set_cart_items);
  const update_cart_totals = useAppStore(state => state.update_cart_totals);

  const queryClient = useQueryClient();

  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  // Get auth headers
  const getAuthHeaders = () => {
    if (auth_token) {
      return { Authorization: `Bearer ${auth_token}` };
    }
    return {};
  };

  // Load cart items query
  const { data: cartData, refetch: refetchCart, error: cartError } = useQuery({
    queryKey: ['cart', current_user?.user_id || session_id],
    queryFn: async (): Promise<CartResponse> => {
      const params: Record<string, string> = {};
      if (!current_user && session_id) {
        params.session_id = session_id;
      }

      const response = await axios.get(`${API_BASE_URL}/cart`, {
        headers: getAuthHeaders(),
        params,
      });
      return response.data;
    },
    enabled: cart_sidebar_open,
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Handle cart data updates
  useEffect(() => {
    if (cartData) {
      set_cart_items(cartData.items);
      update_cart_totals({
        total_quantity: cartData.total_quantity,
        subtotal: cartData.subtotal,
        total: cartData.total,
      });
    }
  }, [cartData, set_cart_items, update_cart_totals]);

  // Handle cart errors
  useEffect(() => {
    if (cartError) {
      setErrorMessage('Failed to load cart items');
    }
  }, [cartError]);

  // Update cart item quantity mutation
  const updateCartItemMutation = useMutation({
    mutationFn: async ({ cart_item_id, quantity }: { cart_item_id: string; quantity: number }): Promise<CartResponse> => {
      const response = await axios.patch(
        `${API_BASE_URL}/cart/${cart_item_id}`,
        { quantity } as UpdateCartItemRequest,
        { headers: getAuthHeaders() }
      );
      return response.data;
    },
    onMutate: ({ cart_item_id }) => {
      setUpdatingItemId(cart_item_id);
      setErrorMessage(null);
    },
    onSuccess: (data) => {
      set_cart_items(data.items);
      update_cart_totals({
        total_quantity: data.total_quantity,
        subtotal: data.subtotal,
        total: data.total,
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      setErrorMessage('Failed to update item quantity');
    },
    onSettled: () => {
      setUpdatingItemId(null);
    },
  });

  // Remove cart item mutation
  const removeCartItemMutation = useMutation({
    mutationFn: async (cart_item_id: string): Promise<CartResponse> => {
      const response = await axios.delete(
        `${API_BASE_URL}/cart/${cart_item_id}`,
        { headers: getAuthHeaders() }
      );
      return response.data;
    },
    onMutate: (cart_item_id) => {
      setUpdatingItemId(cart_item_id);
      setErrorMessage(null);
    },
    onSuccess: (data) => {
      set_cart_items(data.items);
      update_cart_totals({
        total_quantity: data.total_quantity,
        subtotal: data.subtotal,
        total: data.total,
      });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: () => {
      setErrorMessage('Failed to remove item from cart');
    },
    onSettled: () => {
      setUpdatingItemId(null);
    },
  });

  // Load cart when sidebar opens
  useEffect(() => {
    if (cart_sidebar_open) {
      refetchCart();
    }
  }, [cart_sidebar_open, refetchCart]);

  // Handle quantity update
  const handleUpdateQuantity = (cart_item_id: string, new_quantity: number) => {
    if (new_quantity < 1) return;
    updateCartItemMutation.mutate({ cart_item_id, quantity: new_quantity });
  };

  // Handle item removal
  const handleRemoveItem = (cart_item_id: string) => {
    removeCartItemMutation.mutate(cart_item_id);
  };

  // Handle proceed to checkout
  const handleProceedToCheckout = () => {
    toggle_cart_sidebar();
    // Navigation will be handled by Link component
  };

  // Handle continue shopping
  const handleContinueShopping = () => {
    toggle_cart_sidebar();
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      toggle_cart_sidebar();
    }
  };

  // Clear error message
  const clearError = () => {
    setErrorMessage(null);
  };

  // Don't render if sidebar is closed
  if (!cart_sidebar_open) {
    return null;
  }

  const isMobile = current_breakpoint === 'mobile';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />

      {/* Sidebar/Modal */}
      <div className={`
        fixed z-50 bg-white shadow-xl transition-transform duration-300 ease-in-out
        ${isMobile 
          ? 'inset-0 transform translate-x-0' 
          : 'top-0 right-0 h-full w-96 transform translate-x-0'
        }
      `}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Shopping Cart ({total_quantity})
          </h2>
          <button
            onClick={toggle_cart_sidebar}
            className="p-2 -m-2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close cart"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error Message */}
        {error_message && (
          <div className="p-4 bg-red-50 border-l-4 border-red-400">
            <div className="flex justify-between items-center">
              <p className="text-sm text-red-700">{error_message}</p>
              <button
                onClick={clearError}
                className="text-red-400 hover:text-red-600"
                aria-label="Dismiss error"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Cart Content */}
        <div className="flex-1 overflow-y-auto" style={{ height: 'calc(100vh - 200px)' }}>
          {is_loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading cart...</span>
            </div>
          ) : cart_items.length === 0 ? (
            // Empty cart state
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
              <p className="text-gray-500 mb-4">Add some beautiful fragrances to get started</p>
              <Link
                to="/products"
                onClick={handleContinueShopping}
                className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Shop Now
              </Link>
            </div>
          ) : (
            // Cart items
            <div className="p-4 space-y-4">
              {cart_items.map((item) => {
                if (!item.product) return null;
                const isUpdating = updating_item_id === item.cart_item_id;
                const effectivePrice = item.product.sale_price || item.product.price;
                
                return (
                  <div key={item.cart_item_id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                      {item.product?.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {item.product?.name || 'Unknown Product'}
                      </h4>
                      <p className="text-xs text-gray-500">{item.product?.brand || 'Unknown Brand'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {item.product?.sale_price && (
                          <span className="text-xs text-gray-400 line-through">
                            ${item.product.price.toFixed(2)}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-900">
                          ${effectivePrice.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity - 1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <span className="text-sm font-medium text-gray-900 min-w-[2rem] text-center">
                        {isUpdating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
                        ) : (
                          item.quantity
                        )}
                      </span>
                      
                      <button
                        onClick={() => handleUpdateQuantity(item.cart_item_id, item.quantity + 1)}
                        disabled={isUpdating}
                        className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveItem(item.cart_item_id)}
                      disabled={isUpdating}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      aria-label="Remove item"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer/Actions */}
        {cart_items.length > 0 && (
          <div className="border-t border-gray-200 p-4 space-y-4">
            {/* Cart Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">${cart_subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>${cart_total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500">Shipping and taxes calculated at checkout</p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                to="/checkout/shipping"
                onClick={handleProceedToCheckout}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors text-center block"
              >
                Proceed to Checkout
              </Link>
              <div className="flex space-x-2">
                <Link
                  to="/cart"
                  onClick={handleContinueShopping}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors text-center"
                >
                  View Full Cart
                </Link>
                <button
                  onClick={handleContinueShopping}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default GV_CartSidebar;