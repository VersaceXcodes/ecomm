import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

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

interface ProductWithImages extends Product {
  images: ProductImage[];
  primary_image: ProductImage | null;
}

interface ProductsResponse {
  products: ProductWithImages[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

interface CartResponse {
  items: any[];
  total_quantity: number;
  subtotal: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
}

interface NewsletterResponse {
  message: string;
  subscription: {
    subscription_id: string;
    email: string;
    is_active: boolean;
    subscribed_at: string;
  };
}

const UV_Landing: React.FC = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [addToCartLoading, setAddToCartLoading] = useState<{ [key: string]: boolean }>({});
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');

  const queryClient = useQueryClient();

  // Zustand store selectors - individual selectors to avoid infinite loops
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const sessionId = useAppStore(state => state.session_id);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const setCartState = useAppStore(state => state.set_cart_state);
  const setCartItems = useAppStore(state => state.set_cart_items);

  // API Base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  // Fetch featured product
  const { data: featuredProduct, isLoading: loadingFeaturedProduct } = useQuery<ProductWithImages | null>({
    queryKey: ['featured-product'],
    queryFn: async () => {
      const response = await axios.get<ProductsResponse>(`${API_BASE_URL}/products`, {
        params: {
          is_featured: true,
          limit: 1,
          is_active: true
        }
      });
      return response.data.products && response.data.products.length > 0 
        ? response.data.products[0] 
        : null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Fetch all products
  const { data: allProducts = [], isLoading: loadingProducts } = useQuery<ProductWithImages[]>({
    queryKey: ['all-products'],
    queryFn: async () => {
      const response = await axios.get<ProductsResponse>(`${API_BASE_URL}/products`, {
        params: {
          is_active: true,
          limit: 5,
          sort_by: 'created_at',
          sort_order: 'desc'
        }
      });
      return response.data.products || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async ({ productId }: { productId: string }) => {
      const headers: any = {
        'Content-Type': 'application/json',
      };
      
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await axios.post<CartResponse>(
        `${API_BASE_URL}/cart`,
        {
          product_id: productId,
          quantity: 1,
          session_id: !isAuthenticated ? sessionId : null
        },
        { headers }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update global cart state
      setCartState({
        items: data.items,
        total_quantity: data.total_quantity,
        subtotal: data.subtotal,
        total: data.total,
        shipping_cost: data.shipping_cost,
        tax_amount: data.tax_amount,
        is_loading: false
      });
      
      // Invalidate cart queries to refresh cart sidebar
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });

  // Newsletter subscription mutation
  const newsletterMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await axios.post<NewsletterResponse>(
        `${API_BASE_URL}/newsletter/subscribe`,
        { email }
      );
      return response.data;
    },
    onSuccess: () => {
      setNewsletterSuccess(true);
      setNewsletterEmail('');
      setNewsletterError('');
      setTimeout(() => setNewsletterSuccess(false), 5000);
    },
    onError: (error: any) => {
      setNewsletterError(error.response?.data?.message || 'Subscription failed. Please try again.');
      setNewsletterSuccess(false);
    },
  });

  // Handle add to cart
  const handleAddToCart = async (productId: string) => {
    setAddToCartLoading(prev => ({ ...prev, [productId]: true }));
    
    try {
      await addToCartMutation.mutateAsync({ productId });
    } catch (error) {
      console.error('Add to cart failed:', error);
    } finally {
      setAddToCartLoading(prev => ({ ...prev, [productId]: false }));
    }
  };

  // Handle newsletter subscription
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setNewsletterLoading(true);
    try {
      await newsletterMutation.mutateAsync(newsletterEmail.trim());
    } catch (error) {
      console.error('Newsletter subscription failed:', error);
    } finally {
      setNewsletterLoading(false);
    }
  };

  // Get product price display
  const getProductPrice = (product: ProductWithImages) => {
    const hasDiscount = product.sale_price && product.sale_price < product.price;
    return {
      currentPrice: hasDiscount ? product.sale_price : product.price,
      originalPrice: hasDiscount ? product.price : null,
      hasDiscount
    };
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-pink-50 to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                {isAuthenticated && currentUser ? (
                  <span>Welcome back, {currentUser.first_name}!</span>
                ) : (
                  <span>Discover Your Perfect Fragrance</span>
                )}
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8">
                Premium perfumes crafted with the finest ingredients. Experience luxury scents that define your unique style.
              </p>
              
              {!isAuthenticated && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Create Account
                  </Link>
                  <Link
                    to="/products"
                    className="border border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
              )}
            </div>

            {/* Featured Product */}
            <div className="relative">
              {loadingFeaturedProduct ? (
                <div className="bg-white rounded-2xl shadow-lg p-6 animate-pulse">
                  <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ) : featuredProduct ? (
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={featuredProduct.primary_image?.image_url || '/api/placeholder/400/400'}
                      alt={featuredProduct.primary_image?.alt_text || featuredProduct.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    {featuredProduct.sale_price && featuredProduct.sale_price < featuredProduct.price && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded-full text-sm font-semibold">
                        Sale
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{featuredProduct.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{featuredProduct.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {(() => {
                          const { currentPrice, originalPrice, hasDiscount } = getProductPrice(featuredProduct);
                          return (
                            <>
                              <span className="text-2xl font-bold text-gray-900">
                                ${currentPrice?.toFixed(2)}
                              </span>
                              {hasDiscount && originalPrice && (
                                <span className="text-lg text-gray-500 line-through">
                                  ${originalPrice.toFixed(2)}
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                      <span className="text-sm text-gray-500">{featuredProduct.brand}</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(featuredProduct.product_id)}
                        disabled={addToCartLoading[featuredProduct.product_id] || featuredProduct.stock_quantity === 0}
                        className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {addToCartLoading[featuredProduct.product_id] ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Adding...
                          </span>
                        ) : featuredProduct.stock_quantity === 0 ? (
                          'Out of Stock'
                        ) : (
                          'Add to Cart'
                        )}
                      </button>
                      <Link
                        to={`/products/${featuredProduct.product_id}`}
                        className="bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
                  <p className="text-gray-500">No featured product available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Products Grid Section */}
      <section className="py-12 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Premium Collection
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Discover our carefully curated selection of luxury perfumes from the world's finest brands.
            </p>
          </div>

          {loadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(4)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                  <div className="bg-gray-200 h-64"></div>
                  <div className="p-4">
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : allProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {allProducts.map((product) => (
                <div key={product.product_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <Link to={`/products/${product.product_id}`} className="block">
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={product.primary_image?.image_url || '/api/placeholder/300/300'}
                        alt={product.primary_image?.alt_text || product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                      {product.sale_price && product.sale_price < product.price && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                          Sale
                        </div>
                      )}
                      {product.stock_quantity === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                          <span className="text-white font-semibold">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <div className="p-4">
                    <Link to={`/products/${product.product_id}`}>
                      <h3 className="font-semibold text-gray-900 mb-1 hover:text-blue-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
                    <div className="flex items-center justify-between mb-3">
                      {(() => {
                        const { currentPrice, originalPrice, hasDiscount } = getProductPrice(product);
                        return (
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">
                              ${currentPrice?.toFixed(2)}
                            </span>
                            {hasDiscount && originalPrice && (
                              <span className="text-sm text-gray-500 line-through">
                                ${originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => handleAddToCart(product.product_id)}
                      disabled={addToCartLoading[product.product_id] || product.stock_quantity === 0}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {addToCartLoading[product.product_id] ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Adding...
                        </span>
                      ) : product.stock_quantity === 0 ? (
                        'Out of Stock'
                      ) : (
                        'Add to Cart'
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No products available at the moment.</p>
            </div>
          )}

          {allProducts.length > 0 && (
            <div className="text-center mt-12">
              <Link
                to="/products"
                className="inline-block bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
              >
                View All Products
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-12 lg:py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Stay in the Know
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Subscribe to our newsletter for exclusive offers, new arrivals, and fragrance tips.
          </p>
          
          <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  setNewsletterError('');
                }}
                placeholder="Enter your email address"
                required
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={newsletterLoading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {newsletterLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Subscribing...
                  </span>
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
            
            {newsletterSuccess && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                <p className="text-sm">Successfully subscribed to our newsletter!</p>
              </div>
            )}
            
            {newsletterError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <p className="text-sm">{newsletterError}</p>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Trust & Security Section */}
      <section className="py-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Secure Payments</h3>
              <p className="text-sm text-gray-600">SSL encrypted checkout</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Authentic Products</h3>
              <p className="text-sm text-gray-600">100% genuine fragrances</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2V7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Fast Shipping</h3>
              <p className="text-sm text-gray-600">Free shipping over $50</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Easy Returns</h3>
              <p className="text-sm text-gray-600">30-day return policy</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default UV_Landing;