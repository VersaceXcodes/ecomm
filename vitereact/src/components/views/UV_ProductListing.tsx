import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types based on Zod schemas
interface Product {
  product_id: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  stock_quantity: number;
  sku: string;
  brand: string;
  fragrance_notes_top: string[];
  fragrance_notes_middle: string[];
  fragrance_notes_base: string[];
  size_volume: string;
  category_id: string | null;
  is_active: boolean;
  is_featured: boolean;
  meta_title: string | null;
  meta_description: string | null;
  view_count: number;
  sales_count: number;
  created_at: string;
  updated_at: string;
  images?: ProductImage[];
  primary_image?: ProductImage | null;
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

interface Category {
  category_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface ProductsResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface CategoriesResponse {
  categories: Category[];
}

interface CartResponse {
  items: any[];
  total_quantity: number;
  subtotal: number;
  total: number;
  shipping_cost: number;
  tax_amount: number;
}

const UV_ProductListing: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Global state access - using individual selectors to avoid infinite loops
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const sessionId = useAppStore(state => state.session_id);
  const setCartState = useAppStore(state => state.set_cart_state);
  const setCartItems = useAppStore(state => state.set_cart_items);

  // Local state for filters
  const [currentFilters, setCurrentFilters] = useState({
    query: searchParams.get('search_query') || '',
    category_id: searchParams.get('category_id') || '',
    min_price: searchParams.get('price_min') ? Number(searchParams.get('price_min')) : null,
    max_price: searchParams.get('price_max') ? Number(searchParams.get('price_max')) : null,
    sort_by: searchParams.get('sort_by') || 'name',
    sort_order: 'asc' as 'asc' | 'desc',
    limit: 20,
    offset: 0
  });

  // State for UI
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState({
    min: currentFilters.min_price || 0,
    max: currentFilters.max_price || 500
  });

  // Update URL when filters change
  const updateURL = useCallback((filters: typeof currentFilters) => {
    const params = new URLSearchParams();
    
    if (filters.query) params.set('search_query', filters.query);
    if (filters.category_id) params.set('category_id', filters.category_id);
    if (filters.min_price) params.set('price_min', filters.min_price.toString());
    if (filters.max_price) params.set('price_max', filters.max_price.toString());
    if (filters.sort_by && filters.sort_by !== 'name') params.set('sort_by', filters.sort_by);

    setSearchParams(params);
  }, [setSearchParams]);

  // Fetch products
  const { data: productsData, isLoading: loadingProducts, error: productsError } = useQuery<ProductsResponse>({
    queryKey: ['products', currentFilters],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      if (currentFilters.query) params.append('search_query', currentFilters.query);
      if (currentFilters.category_id) params.append('category_id', currentFilters.category_id);
      if (currentFilters.min_price !== null) params.append('price_min', currentFilters.min_price.toString());
      if (currentFilters.max_price !== null) params.append('price_max', currentFilters.max_price.toString());
      params.append('is_active', 'true');
      params.append('sort_by', currentFilters.sort_by);
      params.append('sort_order', currentFilters.sort_order);
      params.append('limit', currentFilters.limit.toString());
      params.append('offset', currentFilters.offset.toString());

      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/products?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 60000,
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Fetch categories
  const { data: categoriesData, isLoading: loadingCategories } = useQuery<CategoriesResponse>({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/categories?is_active=true`
      );
      return response.data;
    },
    staleTime: 300000, // Categories change less frequently
    refetchOnWindowFocus: false,
    retry: 1
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: string) => {
      const payload = {
        product_id: productId,
        quantity: 1,
        session_id: currentUser ? null : sessionId
      };

      const headers: any = {
        'Content-Type': 'application/json'
      };

      if (currentUser && authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/cart`,
        payload,
        { headers }
      );
      return response.data;
    },
    onSuccess: (data: CartResponse) => {
      // Update global cart state
      setCartState({
        items: data.items || [],
        total_quantity: data.total_quantity || 0,
        subtotal: data.subtotal || 0,
        total: data.total || 0,
        shipping_cost: data.shipping_cost || 0,
        tax_amount: data.tax_amount || 0,
        is_loading: false
      });
      
      // Optionally show success message or open cart sidebar
      // You could trigger a toast notification here
    },
    onError: (error) => {
      console.error('Failed to add to cart:', error);
      // Handle error - show error message
    }
  });

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<typeof currentFilters>) => {
    const updatedFilters = { ...currentFilters, ...newFilters, offset: 0 };
    setCurrentFilters(updatedFilters);
    updateURL(updatedFilters);
  };

  // Handle search
  const handleSearch = (query: string) => {
    handleFilterChange({ query });
  };

  // Handle sort change
  const handleSortChange = (sortBy: string) => {
    const [field, order] = sortBy.split('_');
    handleFilterChange({ 
      sort_by: field, 
      sort_order: order as 'asc' | 'desc' 
    });
  };

  // Handle price filter
  const handlePriceFilter = () => {
    handleFilterChange({
      min_price: priceRange.min > 0 ? priceRange.min : null,
      max_price: priceRange.max < 500 ? priceRange.max : null
    });
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      query: '',
      category_id: '',
      min_price: null,
      max_price: null,
      sort_by: 'name',
      sort_order: 'asc' as 'asc' | 'desc',
      limit: 20,
      offset: 0
    };
    setCurrentFilters(clearedFilters);
    setPriceRange({ min: 0, max: 500 });
    setSearchParams({});
  };

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const totalProducts = productsData?.total || 0;

  // Get current price for display (sale price if available, otherwise regular price)
  const getCurrentPrice = (product: Product) => {
    return product.sale_price || product.price;
  };

  // Get primary image URL
  const getPrimaryImageUrl = (product: Product) => {
    if (product.primary_image?.image_url) {
      return product.primary_image.image_url;
    }
    if (product.images && product.images.length > 0) {
      return product.images.find(img => img.is_primary)?.image_url || product.images[0].image_url;
    }
    return '/api/placeholder/300/300'; // Fallback placeholder
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Header Section */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Our Perfume Collection</h1>
                <p className="text-gray-600 mt-1">
                  {loadingProducts ? 'Loading...' : `${totalProducts} ${totalProducts === 1 ? 'fragrance' : 'fragrances'} available`}
                </p>
              </div>
              
              {/* Mobile Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden bg-gray-100 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                Filters
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters Sidebar */}
            <div className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                  {(currentFilters.query || currentFilters.category_id || currentFilters.min_price || currentFilters.max_price) && (
                    <button
                      onClick={clearFilters}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {/* Search */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search
                  </label>
                  <input
                    type="text"
                    value={currentFilters.query}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="Search perfumes..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Categories */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={currentFilters.category_id}
                    onChange={(e) => handleFilterChange({ category_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.category_id} value={category.category_id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">$</span>
                      <input
                        type="number"
                        value={priceRange.min}
                        onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                        placeholder="Min"
                        min="0"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-gray-400">to</span>
                      <span className="text-sm text-gray-600">$</span>
                      <input
                        type="number"
                        value={priceRange.max}
                        onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                        placeholder="Max"
                        min="0"
                        className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <button
                      onClick={handlePriceFilter}
                      className="w-full bg-gray-100 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                    >
                      Apply Price Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {/* Sort and View Controls */}
              <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">Sort by:</span>
                    <select
                      value={`${currentFilters.sort_by}_${currentFilters.sort_order}`}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    >
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="price_asc">Price (Low to High)</option>
                      <option value="price_desc">Price (High to Low)</option>
                      <option value="created_at_desc">Newest First</option>
                      <option value="created_at_asc">Oldest First</option>
                    </select>
                  </div>
                  
                  {currentFilters.query && (
                    <div className="text-sm text-gray-600">
                      Searching for: <span className="font-medium">"{currentFilters.query}"</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Products Grid */}
              {loadingProducts ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-sm border overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : productsError ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <div className="text-red-500 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load products</h3>
                  <p className="text-gray-600 mb-4">There was an error loading the product catalog.</p>
                  <button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['products'] })}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              ) : products.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    {currentFilters.query 
                      ? `No products match your search for "${currentFilters.query}"`
                      : "No products match your current filters"
                    }
                  </p>
                  <button
                    onClick={clearFilters}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.product_id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow group">
                      {/* Product Image */}
                      <Link to={`/products/${product.product_id}`} className="block aspect-square overflow-hidden">
                        <img
                          src={getPrimaryImageUrl(product)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </Link>

                      {/* Product Details */}
                      <div className="p-4">
                        <div className="mb-2">
                          <p className="text-sm text-gray-600 font-medium">{product.brand}</p>
                          <Link to={`/products/${product.product_id}`}>
                            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors line-clamp-2">
                              {product.name}
                            </h3>
                          </Link>
                        </div>

                        {/* Price */}
                        <div className="mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-900">
                              ${getCurrentPrice(product).toFixed(2)}
                            </span>
                            {product.sale_price && (
                              <span className="text-sm text-gray-500 line-through">
                                ${product.price.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Stock Status */}
                        <div className="mb-3">
                          {product.stock_quantity > 0 ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              In Stock ({product.stock_quantity})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Out of Stock
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => addToCartMutation.mutate(product.product_id)}
                            disabled={product.stock_quantity === 0 || addToCartMutation.isPending}
                            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                          >
                            {addToCartMutation.isPending ? (
                              <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Adding...
                              </span>
                            ) : (
                              'Add to Cart'
                            )}
                          </button>
                          <Link
                            to={`/products/${product.product_id}`}
                            className="bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_ProductListing;