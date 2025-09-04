import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

interface ProductReview {
  review_id: string;
  product_id: string;
  user_id: string;
  order_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  is_verified_purchase: boolean;
  is_approved: boolean;
  admin_response: string | null;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
}

interface ProductDetailResponse {
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
  images: ProductImage[];
  primary_image: ProductImage | null;
  category: {
    category_id: string;
    name: string;
    description: string | null;
  } | null;
  related_products: Product[];
  average_rating: number | null;
  review_count: number;
}

interface ReviewsResponse {
  reviews: ProductReview[];
  total: number;
  average_rating: number;
  rating_breakdown: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
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

const UV_ProductDetail: React.FC = () => {
  const { product_id } = useParams<{ product_id: string }>();
  const queryClient = useQueryClient();
  
  // Local state
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'reviews' | 'notes'>('description');

  // Zustand store access (individual selectors)
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const sessionId = useAppStore(state => state.session_id);
  const setCartItems = useAppStore(state => state.set_cart_items);
  // Removed unused setCartLoading
  const updateCartTotals = useAppStore(state => state.update_cart_totals);

  // API base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  // Fetch product details
  const { data: productData, isLoading: loadingProduct, error: productError } = useQuery({
    queryKey: ['product', product_id],
    queryFn: async (): Promise<ProductDetailResponse> => {
      const response = await axios.get(`${API_BASE_URL}/products/${product_id}`);
      return response.data;
    },
    enabled: !!product_id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch product reviews
  const { data: reviewsData, isLoading: loadingReviews } = useQuery({
    queryKey: ['product-reviews', product_id],
    queryFn: async (): Promise<ReviewsResponse> => {
      const response = await axios.get(`${API_BASE_URL}/products/${product_id}/reviews`, {
        params: { limit: 20, offset: 0 }
      });
      return response.data;
    },
    enabled: !!product_id,
    staleTime: 5 * 60 * 1000,
  });

  // Check if product is in wishlist
  const { data: wishlistData } = useQuery({
    queryKey: ['wishlist', currentUser?.user_id],
    queryFn: async () => {
      if (!authToken) return { items: [] };
      const response = await axios.get(`${API_BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 2 * 60 * 1000,
  });

  // Check if current product is in wishlist
  const isInWishlist = wishlistData?.items?.some((item: any) => item.product_id === product_id) || false;

  // Increment view count on component mount
  const { mutate: incrementViewCount } = useMutation({
    mutationFn: async () => {
      await axios.patch(`${API_BASE_URL}/products/${product_id}`);
    },
    onError: (error) => {
      console.log('View count tracking failed:', error);
      // Silent fail for analytics
    }
  });

  // Add to cart mutation
  const { mutate: addToCart, isPending: addToCartLoading } = useMutation({
    mutationFn: async (data: { product_id: string; quantity: number; session_id?: string }) => {
      const response = await axios.post(`${API_BASE_URL}/cart`, data, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      return response.data;
    },
    onSuccess: (data: CartResponse) => {
      // Update global cart state
      setCartItems(data.items);
      updateCartTotals({
        total_quantity: data.total_quantity,
        subtotal: data.subtotal,
        total: data.total,
        shipping_cost: data.shipping_cost,
        tax_amount: data.tax_amount
      });
      
      // Show success feedback
      alert('Product added to cart!');
    },
    onError: (error) => {
      console.error('Add to cart failed:', error);
      alert('Failed to add product to cart. Please try again.');
    }
  });

  // Add to wishlist mutation
  const { mutate: addToWishlist, isPending: addToWishlistLoading } = useMutation({
    mutationFn: async (productId: string) => {
      const response = await axios.post(`${API_BASE_URL}/wishlist`, 
        { product_id: productId },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', currentUser?.user_id] });
      alert('Product added to wishlist!');
    },
    onError: (error) => {
      console.error('Add to wishlist failed:', error);
      alert('Failed to add to wishlist. Please try again.');
    }
  });

  // Remove from wishlist mutation
  const { mutate: removeFromWishlist, isPending: removeFromWishlistLoading } = useMutation({
    mutationFn: async (productId: string) => {
      await axios.delete(`${API_BASE_URL}/wishlist/product/${productId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist', currentUser?.user_id] });
      alert('Product removed from wishlist!');
    },
    onError: (error) => {
      console.error('Remove from wishlist failed:', error);
      alert('Failed to remove from wishlist. Please try again.');
    }
  });

  // Increment view count on mount
  useEffect(() => {
    if (product_id) {
      incrementViewCount();
    }
  }, [product_id, incrementViewCount]);

  // Handlers
  const handleAddToCart = () => {
    if (!productData) return;
    
    addToCart({
      product_id: product_id!,
      quantity: selectedQuantity,
      session_id: !isAuthenticated ? sessionId : undefined
    });
  };

  const handleWishlistToggle = () => {
    if (!isAuthenticated) {
      alert('Please login to use wishlist functionality');
      return;
    }
    
    if (!product_id) return;

    if (isInWishlist) {
      removeFromWishlist(product_id);
    } else {
      addToWishlist(product_id);
    }
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = selectedQuantity + change;
    if (newQuantity >= 1 && newQuantity <= (productData?.stock_quantity || 0)) {
      setSelectedQuantity(newQuantity);
    }
  };

  const displayPrice = productData?.sale_price || productData?.price || 0;
  const originalPrice = productData?.sale_price ? productData.price : null;
  const isOnSale = !!productData?.sale_price;
  const isOutOfStock = (productData?.stock_quantity || 0) === 0;

  // Loading state
  if (loadingProduct) {
    return (
      <>
        <div className="min-h-screen bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="animate-pulse">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-300 rounded-lg h-96"></div>
                <div className="space-y-4">
                  <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-6 bg-gray-300 rounded w-1/2"></div>
                  <div className="h-20 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (productError || !productData) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-6">The product you're looking for doesn't exist or has been removed.</p>
            <Link 
              to="/products"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        </div>
      </>
    );
  }

  const images = productData.images || [];
  const primaryImage = productData.primary_image || images[0];

  return (
    <>
      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex text-sm text-gray-500">
            <Link to="/" className="hover:text-gray-700">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:text-gray-700">Products</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900">{productData.name}</span>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={images[selectedImageIndex]?.image_url || primaryImage?.image_url || '/placeholder-product.jpg'}
                  alt={images[selectedImageIndex]?.alt_text || productData.name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.image_id}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImageIndex === index ? 'border-blue-600' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={image.alt_text || productData.name}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Information */}
            <div className="space-y-6">
              {/* Brand */}
              <div className="text-sm text-gray-600 uppercase tracking-wide">{productData.brand}</div>
              
              {/* Name */}
              <h1 className="text-3xl font-bold text-gray-900">{productData.name}</h1>
              
              {/* Price */}
              <div className="flex items-center space-x-4">
                <span className="text-3xl font-bold text-gray-900">${displayPrice.toFixed(2)}</span>
                {isOnSale && originalPrice && (
                  <span className="text-xl text-gray-500 line-through">${originalPrice.toFixed(2)}</span>
                )}
                {isOnSale && (
                  <span className="bg-red-100 text-red-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    Sale
                  </span>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center space-x-2">
                {isOutOfStock ? (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-600 font-medium">In Stock ({productData.stock_quantity} available)</span>
                  </>
                )}
              </div>

              {/* Size */}
              <div className="text-gray-700">
                <span className="font-medium">Size:</span> {productData.size_volume}
              </div>

              {/* Description Preview */}
              {productData.description && (
                <div className="prose prose-sm text-gray-700">
                  <p>
                    {showFullDescription 
                      ? productData.description 
                      : `${productData.description.substring(0, 200)}${productData.description.length > 200 ? '...' : ''}`
                    }
                  </p>
                  {productData.description.length > 200 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showFullDescription ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>
              )}

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={selectedQuantity <= 1}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <span className="w-12 text-center font-medium">{selectedQuantity}</span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={selectedQuantity >= (productData.stock_quantity || 0)}
                      className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addToCartLoading}
                  className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addToCartLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adding to Cart...
                    </span>
                  ) : isOutOfStock ? (
                    'Out of Stock'
                  ) : (
                    'Add to Cart'
                  )}
                </button>

                <div className="flex space-x-3">
                  <Link
                    to="/checkout/shipping"
                    className="flex-1 bg-gray-900 text-white py-3 px-6 rounded-lg font-medium text-center hover:bg-gray-800 transition-colors"
                  >
                    Buy Now
                  </Link>
                  
                  <button
                    onClick={handleWishlistToggle}
                    disabled={addToWishlistLoading || removeFromWishlistLoading}
                    className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                      isInWishlist 
                        ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100' 
                        : 'border-gray-300 text-gray-600 hover:border-gray-400'
                    }`}
                  >
                    {addToWishlistLoading || removeFromWishlistLoading ? (
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg 
                        className="h-5 w-5" 
                        fill={isInWishlist ? "currentColor" : "none"} 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Product Details Tabs */}
          <div className="mt-16">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'description'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Description
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'notes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Fragrance Notes
                </button>
                <button
                  onClick={() => setActiveTab('reviews')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'reviews'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Reviews ({reviewsData?.total || 0})
                </button>
              </nav>
            </div>

            <div className="py-8">
              {activeTab === 'description' && (
                <div className="prose prose-gray max-w-none">
                  <p>{productData.description || 'No description available.'}</p>
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900">Product Details</h4>
                      <dl className="mt-3 space-y-2">
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-600">Brand:</dt>
                          <dd className="text-sm text-gray-900">{productData.brand}</dd>
                        </div>
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-600">Size:</dt>
                          <dd className="text-sm text-gray-900">{productData.size_volume}</dd>
                        </div>
                        <div className="flex">
                          <dt className="w-24 text-sm text-gray-600">SKU:</dt>
                          <dd className="text-sm text-gray-900">{productData.sku}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-6">
                  {productData.fragrance_notes_top.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Top Notes</h4>
                      <div className="flex flex-wrap gap-2">
                        {productData.fragrance_notes_top.map((note, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {productData.fragrance_notes_middle.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Middle Notes</h4>
                      <div className="flex flex-wrap gap-2">
                        {productData.fragrance_notes_middle.map((note, index) => (
                          <span key={index} className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {productData.fragrance_notes_base.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Base Notes</h4>
                      <div className="flex flex-wrap gap-2">
                        {productData.fragrance_notes_base.map((note, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  {loadingReviews ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="mt-2 text-gray-600">Loading reviews...</p>
                    </div>
                  ) : reviewsData && reviewsData.reviews.length > 0 ? (
                    <>
                      {/* Rating Summary */}
                      {productData.average_rating && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="flex items-center space-x-4">
                            <div className="text-3xl font-bold text-gray-900">
                              {productData.average_rating.toFixed(1)}
                            </div>
                            <div>
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <svg
                                    key={rating}
                                    className={`h-5 w-5 ${
                                      rating <= Math.round(productData.average_rating || 0)
                                        ? 'text-yellow-400'
                                        : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <p className="text-sm text-gray-600">
                                Based on {productData.review_count} reviews
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Reviews List */}
                      <div className="space-y-6">
                        {reviewsData.reviews.map((review) => (
                          <div key={review.review_id} className="border-b border-gray-200 pb-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <svg
                                    key={rating}
                                    className={`h-4 w-4 ${
                                      rating <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                    }`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                  </svg>
                                ))}
                              </div>
                              <span className="text-sm text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            
                            {review.title && (
                              <h5 className="mt-2 font-medium text-gray-900">{review.title}</h5>
                            )}
                            
                            {review.comment && (
                              <p className="mt-2 text-gray-700">{review.comment}</p>
                            )}
                            
                            {review.is_verified_purchase && (
                              <span className="inline-flex items-center mt-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Verified Purchase
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {productData.related_products && productData.related_products.length > 0 && (
            <div className="mt-16">
              <h3 className="text-2xl font-bold text-gray-900 mb-8">You Might Also Like</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {productData.related_products.map((relatedProduct) => (
                  <Link
                    key={relatedProduct.product_id}
                    to={`/products/${relatedProduct.product_id}`}
                    className="group"
                  >
                    <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden group-hover:opacity-75 transition-opacity">
                      <img
                        src="/placeholder-product.jpg"
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{relatedProduct.brand}</p>
                      <h4 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {relatedProduct.name}
                      </h4>
                      <p className="text-lg font-semibold text-gray-900">
                        ${(relatedProduct.sale_price || relatedProduct.price).toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UV_ProductDetail;