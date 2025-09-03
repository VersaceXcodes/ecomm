import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';

// Types based on OpenAPI schemas
interface Product {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  sku: string;
  brand: string;
  size_volume: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

interface ProductImage {
  image_id: string;
  product_id: string;
  image_url: string;
  alt_text: string | null;
  display_order: number;
  is_primary: boolean;
  created_at: string;
}

interface WishlistItem {
  wishlist_item_id: string;
  user_id: string;
  product_id: string;
  added_at: string;
}

interface WishlistItemWithProduct extends WishlistItem {
  product: Product & {
    images: ProductImage[];
    primary_image?: ProductImage;
  };
}

interface WishlistResponse {
  items: WishlistItemWithProduct[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface WishlistAnalytics {
  total_value: number;
  average_price: number;
  price_alerts: number;
}

// API Functions
const fetchWishlist = async (authToken: string): Promise<WishlistResponse> => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/wishlist`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      params: {
        limit: 50,
        offset: 0,
      },
    }
  );
  return response.data;
};

const removeFromWishlist = async (wishlistItemId: string, authToken: string): Promise<void> => {
  await axios.delete(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/wishlist/${wishlistItemId}`,
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
};

const addToCart = async (productId: string, quantity: number, authToken: string): Promise<any> => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/cart`,
    {
      product_id: productId,
      quantity: quantity,
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return response.data;
};

const addMultipleToCart = async (items: { product_id: string; quantity: number }[], authToken: string): Promise<any> => {
  // Since the API doesn't support bulk add, we'll make multiple calls
  const promises = items.map(item => addToCart(item.product_id, item.quantity, authToken));
  return Promise.all(promises);
};

const UV_Wishlist: React.FC = () => {
  // Local state
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [sortOption, setSortOption] = useState<string>('added_at_desc');

  // Global state selectors (individual to avoid infinite loops)
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const setCartItems = useAppStore(state => state.set_cart_items);
  const setCartLoading = useAppStore(state => state.set_cart_loading);

  // React Query
  const queryClient = useQueryClient();

  // Fetch wishlist data
  const {
    data: wishlistData,
    isLoading: loadingWishlist,
    error: wishlistError,
    refetch: refetchWishlist,
  } = useQuery({
    queryKey: ['wishlist', currentUser?.user_id],
    queryFn: () => fetchWishlist(authToken!),
    enabled: !!authToken && isAuthenticated,
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: false,
    retry: 1,
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: ({ wishlistItemId }: { wishlistItemId: string }) => 
      removeFromWishlist(wishlistItemId, authToken!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (error) => {
      console.error('Error removing from wishlist:', error);
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) => 
      addToCart(productId, quantity, authToken!),
    onSuccess: () => {
      // Refresh cart data
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Error adding to cart:', error);
    },
  });

  // Bulk add to cart mutation
  const bulkAddToCartMutation = useMutation({
    mutationFn: (items: { product_id: string; quantity: number }[]) => 
      addMultipleToCart(items, authToken!),
    onSuccess: () => {
      setSelectedItems([]);
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      console.error('Error bulk adding to cart:', error);
    },
  });

  // Calculate analytics
  const wishlistAnalytics: WishlistAnalytics = useMemo(() => {
    if (!wishlistData?.items) {
      return { total_value: 0, average_price: 0, price_alerts: 0 };
    }

    const items = wishlistData.items;
    const totalValue = items.reduce((sum, item) => {
      const price = item.product.sale_price || item.product.price;
      return sum + price;
    }, 0);

    const averagePrice = items.length > 0 ? totalValue / items.length : 0;

    return {
      total_value: totalValue,
      average_price: averagePrice,
      price_alerts: 0, // Would need additional logic for price tracking
    };
  }, [wishlistData]);

  // Sort wishlist items
  const sortedWishlistItems = useMemo(() => {
    if (!wishlistData?.items) return [];

    const items = [...wishlistData.items];
    
    switch (sortOption) {
      case 'added_at_asc':
        return items.sort((a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime());
      case 'added_at_desc':
        return items.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
      case 'name_asc':
        return items.sort((a, b) => a.product.name.localeCompare(b.product.name));
      case 'name_desc':
        return items.sort((a, b) => b.product.name.localeCompare(a.product.name));
      case 'price_asc':
        return items.sort((a, b) => {
          const priceA = a.product.sale_price || a.product.price;
          const priceB = b.product.sale_price || b.product.price;
          return priceA - priceB;
        });
      case 'price_desc':
        return items.sort((a, b) => {
          const priceA = a.product.sale_price || a.product.price;
          const priceB = b.product.sale_price || b.product.price;
          return priceB - priceA;
        });
      default:
        return items;
    }
  }, [wishlistData, sortOption]);

  // Handle select all/none
  const handleSelectAll = () => {
    if (selectedItems.length === sortedWishlistItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(sortedWishlistItems.map(item => item.wishlist_item_id));
    }
  };

  // Handle individual item selection
  const handleItemSelect = (wishlistItemId: string) => {
    setSelectedItems(prev => 
      prev.includes(wishlistItemId) 
        ? prev.filter(id => id !== wishlistItemId)
        : [...prev, wishlistItemId]
    );
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = (wishlistItemId: string) => {
    removeFromWishlistMutation.mutate({ wishlistItemId });
  };

  // Handle add to cart
  const handleAddToCart = (productId: string) => {
    addToCartMutation.mutate({ productId, quantity: 1 });
  };

  // Handle bulk add to cart
  const handleBulkAddToCart = () => {
    const selectedWishlistItems = sortedWishlistItems.filter(item => 
      selectedItems.includes(item.wishlist_item_id)
    );
    const cartItems = selectedWishlistItems.map(item => ({
      product_id: item.product_id,
      quantity: 1,
    }));
    
    bulkAddToCartMutation.mutate(cartItems);
  };

  // Handle bulk remove
  const handleBulkRemove = () => {
    selectedItems.forEach(wishlistItemId => {
      removeFromWishlistMutation.mutate({ wishlistItemId });
    });
    setSelectedItems([]);
  };

  // Get primary image or first image
  const getPrimaryImage = (product: Product & { images: ProductImage[] }): string => {
    const primaryImage = product.images?.find(img => img.is_primary);
    const firstImage = product.images?.[0];
    return primaryImage?.image_url || firstImage?.image_url || '/placeholder-product.jpg';
  };

  // Show loading state
  if (loadingWishlist) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center min-h-96">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Show error state
  if (wishlistError) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Wishlist</h3>
                <p className="text-red-600 mb-4">Unable to load your saved products. Please try again.</p>
                <button
                  onClick={() => refetchWishlist()}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const wishlistItems = sortedWishlistItems || [];

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlist</h1>
            <p className="text-gray-600">Save your favorite products for later</p>
          </div>

          {/* Analytics Summary */}
          {wishlistItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {wishlistItems.length}
                  </p>
                  <p className="text-gray-600">Saved Items</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ${wishlistAnalytics.total_value.toFixed(2)}
                  </p>
                  <p className="text-gray-600">Total Value</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ${wishlistAnalytics.average_price.toFixed(2)}
                  </p>
                  <p className="text-gray-600">Average Price</p>
                </div>
              </div>
            </div>
          )}

          {/* Controls */}
          {wishlistItems.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Bulk Actions */}
                <div className="flex items-center gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === wishlistItems.length && wishlistItems.length > 0}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Select All ({selectedItems.length}/{wishlistItems.length})
                    </span>
                  </label>
                  
                  {selectedItems.length > 0 && (
                    <div className="flex gap-2">
                      <button
                        onClick={handleBulkAddToCart}
                        disabled={bulkAddToCartMutation.isPending}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                      >
                        {bulkAddToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                      </button>
                      <button
                        onClick={handleBulkRemove}
                        disabled={removeFromWishlistMutation.isPending}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Sort Options */}
                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="text-sm text-gray-700">Sort by:</label>
                  <select
                    id="sort"
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="added_at_desc">Recently Added</option>
                    <option value="added_at_asc">Oldest First</option>
                    <option value="name_asc">Name A-Z</option>
                    <option value="name_desc">Name Z-A</option>
                    <option value="price_asc">Price Low to High</option>
                    <option value="price_desc">Price High to Low</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Wishlist Items */}
          {wishlistItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
                <p className="text-gray-600 mb-6">Save products you love to keep track of them</p>
                <Link
                  to="/products"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Browse Products
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {wishlistItems.map((item) => {
                const currentPrice = item.product.sale_price || item.product.price;
                const isOnSale = !!item.product.sale_price;
                const isSelected = selectedItems.includes(item.wishlist_item_id);
                const isInStock = item.product.stock_quantity > 0;

                return (
                  <div
                    key={item.wishlist_item_id}
                    className={`bg-white rounded-lg shadow-sm border-2 transition-all duration-200 ${
                      isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Selection Checkbox */}
                    <div className="p-3 pb-0">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleItemSelect(item.wishlist_item_id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 text-xs text-gray-500">Select</span>
                      </label>
                    </div>

                    {/* Product Image */}
                    <div className="relative px-3">
                      <Link to={`/products/${item.product_id}`}>
                        <img
                          src={getPrimaryImage(item.product)}
                          alt={item.product.name}
                          className="w-full h-48 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-product.jpg';
                          }}
                        />
                      </Link>
                      
                      {/* Stock Status Badge */}
                      {!isInStock && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Out of Stock
                        </div>
                      )}
                      
                      {/* Sale Badge */}
                      {isOnSale && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                          Sale
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <Link 
                        to={`/products/${item.product_id}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors block mb-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-600 mb-2">{item.product.brand}</p>
                      <p className="text-xs text-gray-500 mb-3">{item.product.size_volume}</p>
                      
                      {/* Price */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg font-bold text-gray-900">
                          ${currentPrice.toFixed(2)}
                        </span>
                        {isOnSale && (
                          <span className="text-sm text-gray-500 line-through">
                            ${item.product.price.toFixed(2)}
                          </span>
                        )}
                      </div>

                      {/* Stock Status */}
                      <div className="mb-4">
                        {isInStock ? (
                          <span className="text-xs text-green-600 font-medium">
                            ✓ In Stock ({item.product.stock_quantity} available)
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 font-medium">
                            ✗ Out of Stock
                          </span>
                        )}
                      </div>

                      {/* Added Date */}
                      <p className="text-xs text-gray-500 mb-4">
                        Added {new Date(item.added_at).toLocaleDateString()}
                      </p>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        <button
                          onClick={() => handleAddToCart(item.product_id)}
                          disabled={!isInStock || addToCartMutation.isPending}
                          className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {addToCartMutation.isPending ? 'Adding...' : 'Add to Cart'}
                        </button>
                        
                        <button
                          onClick={() => handleRemoveFromWishlist(item.wishlist_item_id)}
                          disabled={removeFromWishlistMutation.isPending}
                          className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition-colors"
                        >
                          {removeFromWishlistMutation.isPending ? 'Removing...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Continue Shopping */}
          {wishlistItems.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_Wishlist;