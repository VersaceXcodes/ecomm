import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types from Zod schemas
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

interface Category {
  category_id: string;
  name: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface ProductWithImages extends Product {
  images: ProductImage[];
  primary_image: ProductImage | null;
}

interface CreateProductInput {
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
  meta_title: string | null;
  meta_description: string | null;
}

interface UpdateProductInput {
  name?: string;
  description?: string | null;
  price?: number;
  sale_price?: number | null;
  stock_quantity?: number;
  is_active?: boolean;
  is_featured?: boolean;
}

const UV_AdminProducts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  // Admin state from Zustand
  const adminToken = useAppStore(state => state.admin_state.admin_token);
  const isAdminAuthenticated = useAppStore(state => state.admin_state.is_authenticated);
  
  // Local state
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search_query') || '');
  const [statusFilter, setStatusFilter] = useState<boolean | null>(
    searchParams.get('is_active') ? searchParams.get('is_active') === 'true' : null
  );
  const [featuredFilter, setFeaturedFilter] = useState<boolean | null>(
    searchParams.get('is_featured') ? searchParams.get('is_featured') === 'true' : null
  );
  const [categoryFilter, setCategoryFilter] = useState<string | null>(searchParams.get('category_id') || null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  // Removed unused editingProductId state
  
  // Product form state
  const [productForm, setProductForm] = useState<CreateProductInput>({
    name: '',
    description: null,
    price: 0,
    sale_price: null,
    stock_quantity: 0,
    sku: '',
    brand: '',
    fragrance_notes_top: [],
    fragrance_notes_middle: [],
    fragrance_notes_base: [],
    size_volume: '',
    category_id: null,
    meta_title: null,
    meta_description: null,
  });

  // API functions
  const fetchAdminProducts = async () => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search_query', searchQuery);
    if (statusFilter !== null) params.append('is_active', String(statusFilter));
    if (featuredFilter !== null) params.append('is_featured', String(featuredFilter));
    if (categoryFilter) params.append('category_id', categoryFilter);
    params.append('limit', '20');
    params.append('offset', '0');
    
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/products?${params}`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    return response.data;
  };

  const fetchCategories = async () => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/categories?is_active=true`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    return response.data;
  };

  // Queries
  const { data: productsData, isLoading: loadingProducts, error: productsError } = useQuery({
    queryKey: ['admin-products', searchQuery, statusFilter, featuredFilter, categoryFilter],
    queryFn: fetchAdminProducts,
    enabled: isAdminAuthenticated && !!adminToken,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchCategories,
    enabled: isAdminAuthenticated && !!adminToken,
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (data: CreateProductInput) => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/products`,
        data,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowCreateModal(false);
      resetProductForm();
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ productId, data }: { productId: string; data: UpdateProductInput }) => {
      const response = await axios.patch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/products/${productId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      // Removed setEditingProductId call
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/products/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      setShowDeleteConfirm(null);
    },
  });

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search_query', searchQuery);
    if (statusFilter !== null) params.set('is_active', String(statusFilter));
    if (featuredFilter !== null) params.set('is_featured', String(featuredFilter));
    if (categoryFilter) params.set('category_id', categoryFilter);
    
    setSearchParams(params, { replace: true });
  }, [searchQuery, statusFilter, featuredFilter, categoryFilter, setSearchParams]);

  // Helper functions
  const resetProductForm = () => {
    setProductForm({
      name: '',
      description: null,
      price: 0,
      sale_price: null,
      stock_quantity: 0,
      sku: '',
      brand: '',
      fragrance_notes_top: [],
      fragrance_notes_middle: [],
      fragrance_notes_base: [],
      size_volume: '',
      category_id: null,
      meta_title: null,
      meta_description: null,
    });
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check 5-product limit
    if (productsData?.products?.length >= 5) {
      alert('Maximum 5 products allowed. Please delete an existing product before creating a new one.');
      return;
    }
    
    createProductMutation.mutate(productForm);
  };

  const handleUpdateProduct = (productId: string, updates: UpdateProductInput) => {
    updateProductMutation.mutate({ productId, data: updates });
  };

  const handleDeleteProduct = (productId: string) => {
    deleteProductMutation.mutate(productId);
  };

  const handleBulkToggleActive = (isActive: boolean) => {
    selectedProducts.forEach(productId => {
      handleUpdateProduct(productId, { is_active: isActive });
    });
    setSelectedProducts([]);
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === productsData?.products?.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(productsData?.products?.map((p: ProductWithImages) => p.product_id) || []);
    }
  };

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const totalProducts = productsData?.total || 0;

  if (!isAdminAuthenticated) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Access Required</h2>
            <p className="text-gray-600 mb-4">Please log in to access the admin panel.</p>
            <Link 
              to="/admin/login"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
                <p className="mt-1 text-sm text-gray-600">
                  Manage your product catalog ({totalProducts}/5 products)
                </p>
              </div>
              <div className="flex space-x-4">
                <Link
                  to="/admin/orders"
                  className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                >
                  View Orders
                </Link>
                <button
                  onClick={() => setShowCreateModal(true)}
                  disabled={totalProducts >= 5}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {totalProducts >= 5 ? 'Product Limit Reached' : 'Add Product'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={statusFilter === null ? '' : String(statusFilter)}
                  onChange={(e) => setStatusFilter(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Featured</label>
                <select
                  value={featuredFilter === null ? '' : String(featuredFilter)}
                  onChange={(e) => setFeaturedFilter(e.target.value === '' ? null : e.target.value === 'true')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Products</option>
                  <option value="true">Featured</option>
                  <option value="false">Not Featured</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={categoryFilter || ''}
                  onChange={(e) => setCategoryFilter(e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Categories</option>
                  {categories.map((category: Category) => (
                    <option key={category.category_id} value={category.category_id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {selectedProducts.length > 0 && (
              <div className="mt-4 flex items-center justify-between bg-blue-50 p-4 rounded-md">
                <span className="text-sm text-blue-700">
                  {selectedProducts.length} product(s) selected
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => handleBulkToggleActive(true)}
                    className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => handleBulkToggleActive(false)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Deactivate
                  </button>
                  <button
                    onClick={() => setSelectedProducts([])}
                    className="text-sm bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700"
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Products Grid */}
          {loadingProducts ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : productsError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <p>Error loading products. Please try again.</p>
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || statusFilter !== null || featuredFilter !== null || categoryFilter
                  ? 'No products match your current filters.'
                  : 'You haven\'t created any products yet.'}
              </p>
              {totalProducts < 5 && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Create Your First Product
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length && products.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-3 text-sm font-medium text-gray-700">Select All</span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200">
                {products.map((product: ProductWithImages) => (
                  <div key={product.product_id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-start space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.product_id)}
                        onChange={() => handleSelectProduct(product.product_id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      
                      {product.primary_image && (
                        <img
                          src={product.primary_image.image_url}
                          alt={product.primary_image.alt_text || product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{product.name}</h3>
                            <p className="text-sm text-gray-600">{product.brand} • {product.sku}</p>
                            <div className="mt-1 flex items-center space-x-4">
                              <span className="text-lg font-semibold text-gray-900">
                                ${product.sale_price || product.price}
                              </span>
                              {product.sale_price && (
                                <span className="text-sm text-gray-500 line-through">
                                  ${product.price}
                                </span>
                              )}
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                product.stock_quantity > 0 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {product.stock_quantity} in stock
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {product.is_active ? 'Active' : 'Inactive'}
                            </span>
                            
                            {product.is_featured && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {product.description && (
                          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Views: {product.view_count}</span>
                            <span>Sales: {product.sales_count}</span>
                            <span>Updated: {new Date(product.updated_at).toLocaleDateString()}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUpdateProduct(product.product_id, { is_featured: !product.is_featured })}
                              className={`text-sm px-3 py-1 rounded transition-colors ${
                                product.is_featured
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {product.is_featured ? 'Unfeature' : 'Feature'}
                            </button>
                            
                            <button
                              onClick={() => handleUpdateProduct(product.product_id, { is_active: !product.is_active })}
                              className={`text-sm px-3 py-1 rounded transition-colors ${
                                product.is_active
                                  ? 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {product.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            
                            <button
                              onClick={() => {/* Removed setEditingProductId call */}}
                              className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded hover:bg-blue-200 transition-colors"
                            >
                              Edit
                            </button>
                            
                            <button
                              onClick={() => setShowDeleteConfirm(product.product_id)}
                              className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded hover:bg-red-200 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Create Product Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Create New Product</h2>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleCreateProduct} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SKU *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.sku}
                        onChange={(e) => setProductForm(prev => ({ ...prev, sku: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Brand *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.brand}
                        onChange={(e) => setProductForm(prev => ({ ...prev, brand: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Size/Volume *
                      </label>
                      <input
                        type="text"
                        required
                        value={productForm.size_volume}
                        onChange={(e) => setProductForm(prev => ({ ...prev, size_volume: e.target.value }))}
                        placeholder="e.g., 100ml, 3.4 fl oz"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sale Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={productForm.sale_price || ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, sale_price: e.target.value ? parseFloat(e.target.value) : null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={productForm.stock_quantity}
                        onChange={(e) => setProductForm(prev => ({ ...prev, stock_quantity: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={productForm.category_id || ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, category_id: e.target.value || null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map((category: Category) => (
                          <option key={category.category_id} value={category.category_id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={productForm.description || ''}
                      onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value || null }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Top Notes
                      </label>
                      <input
                        type="text"
                        value={productForm.fragrance_notes_top.join(', ')}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          fragrance_notes_top: e.target.value.split(',').map(note => note.trim()).filter(note => note)
                        }))}
                        placeholder="Bergamot, Lemon, Orange"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Middle Notes
                      </label>
                      <input
                        type="text"
                        value={productForm.fragrance_notes_middle.join(', ')}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          fragrance_notes_middle: e.target.value.split(',').map(note => note.trim()).filter(note => note)
                        }))}
                        placeholder="Rose, Jasmine, Lavender"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Notes
                      </label>
                      <input
                        type="text"
                        value={productForm.fragrance_notes_base.join(', ')}
                        onChange={(e) => setProductForm(prev => ({ 
                          ...prev, 
                          fragrance_notes_base: e.target.value.split(',').map(note => note.trim()).filter(note => note)
                        }))}
                        placeholder="Musk, Vanilla, Sandalwood"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Title (SEO)
                      </label>
                      <input
                        type="text"
                        value={productForm.meta_title || ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, meta_title: e.target.value || null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Meta Description (SEO)
                      </label>
                      <input
                        type="text"
                        value={productForm.meta_description || ''}
                        onChange={(e) => setProductForm(prev => ({ ...prev, meta_description: e.target.value || null }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createProductMutation.isPending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {createProductMutation.isPending ? 'Creating...' : 'Create Product'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delete Product</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(showDeleteConfirm)}
                    disabled={deleteProductMutation.isPending}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UV_AdminProducts;