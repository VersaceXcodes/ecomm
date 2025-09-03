import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// API Response Interfaces
interface ProductSearchResponse {
  products: Array<{
    product_id: string;
    name: string;
    price: number;
    sale_price: number | null;
    brand: string;
    primary_image?: string;
  }>;
  total: number;
}

interface LogoutResponse {
  message: string;
}

// Navigation Structure Interfaces
interface MenuLink {
  label: string;
  path: string;
  icon?: string;
  external?: boolean;
}

interface MenuSection {
  title?: string;
  links: MenuLink[];
}

interface NavigationSections {
  primary: MenuSection[];
  secondary: MenuSection[];
  tertiary: MenuSection[];
}

const GV_MobileMenu: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Zustand store selectors (individual selectors to avoid infinite loops)
  const isMobileMenuOpen = useAppStore(state => state.ui_state.mobile_menu_open);
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const cartItemCount = useAppStore(state => state.cart_state.total_quantity);
  const cartTotal = useAppStore(state => state.cart_state.total);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  
  // Store actions
  const toggleMobileMenu = useAppStore(state => state.toggle_mobile_menu);
  const clearAuthenticationState = useAppStore(state => state.clear_authentication_state);
  const setSearchQuery = useAppStore(state => state.set_search_query);

  // API Calls
  const performMobileSearch = async (query: string): Promise<ProductSearchResponse> => {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/products`, {
      params: {
        search_query: query,
        limit: 20,
        offset: 0
      }
    });
    return response.data;
  };

  const loadRecentProducts = async (): Promise<ProductSearchResponse> => {
    const headers: Record<string, string> = {};
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/products`, {
      params: {
        limit: 5,
        sort_by: 'view_count',
        sort_order: 'desc'
      },
      headers
    });
    return response.data;
  };

  const logoutUser = async (): Promise<LogoutResponse> => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      }
    );
    return response.data;
  };

  // React Query hooks
  const { data: recentProducts } = useQuery({
    queryKey: ['recent-products'],
    queryFn: loadRecentProducts,
    enabled: isMobileMenuOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1
  });

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearAuthenticationState();
      toggleMobileMenu(); // Close menu
      queryClient.clear(); // Clear all cached data
      navigate('/');
    },
    onError: (error) => {
      console.error('Logout error:', error);
      // Force logout on client side even if server call fails
      clearAuthenticationState();
      toggleMobileMenu();
      navigate('/');
    }
  });

  // Navigation sections structure
  const navigationSections: NavigationSections = {
    primary: [
      {
        links: [
          { label: 'Products', path: '/products', icon: '🛍️' },
          { label: 'About', path: '/about', icon: 'ℹ️' },
          { label: 'Contact', path: '/contact', icon: '📞' }
        ]
      }
    ],
    secondary: [
      {
        title: isAuthenticated ? `Welcome, ${currentUser?.first_name}!` : 'Account',
        links: isAuthenticated ? [
          { label: 'Dashboard', path: '/account', icon: '🏠' },
          { label: 'Orders', path: '/account/orders', icon: '📦' },
          { label: 'Addresses', path: '/account/addresses', icon: '📍' },
          { label: 'Wishlist', path: '/account/wishlist', icon: '❤️' }
        ] : [
          { label: 'Login', path: '/login', icon: '🔐' },
          { label: 'Register', path: '/register', icon: '📝' }
        ]
      }
    ],
    tertiary: [
      {
        title: 'Legal',
        links: [
          { label: 'Privacy Policy', path: '/privacy', icon: '🔒' }
        ]
      }
    ]
  };

  // Handle search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchQuery(searchQuery.trim());
      toggleMobileMenu(); // Close menu
      navigate(`/products?search_query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Handle navigation and close menu
  const handleNavigation = (path: string) => {
    toggleMobileMenu();
    navigate(path);
  };

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Handle overlay click (close menu)
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) {
      toggleMobileMenu();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        toggleMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      
      // Focus management
      if (menuRef.current) {
        menuRef.current.focus();
      }
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen, toggleMobileMenu]);

  // Don't render if menu is not open
  if (!isMobileMenuOpen) {
    return null;
  }

  return (
    <>
      {/* Full-screen overlay */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        onClick={handleOverlayClick}
      >
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          aria-hidden="true"
        />
        
        {/* Menu panel */}
        <div
          ref={menuRef}
          className="fixed inset-y-0 right-0 max-w-sm w-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out focus:outline-none"
          tabIndex={-1}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="rounded-md p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Close menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {/* Search Section */}
            <div className="p-4 border-b border-gray-200">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search perfumes..."
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Search products"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Submit search"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Cart Quick Access */}
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => handleNavigation('/cart')}
                className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label={`View cart with ${cartItemCount} items, total $${cartTotal.toFixed(2)}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.8 9H19M7 13v6a2 2 0 002 2h6a2 2 0 002-2v-6" />
                    </svg>
                    {cartItemCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Cart ({cartItemCount} {cartItemCount === 1 ? 'item' : 'items'})
                    </div>
                    <div className="text-sm text-gray-600">${cartTotal.toFixed(2)}</div>
                  </div>
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Primary Navigation */}
            <nav className="p-4 space-y-2" role="navigation" aria-label="Primary navigation">
              {navigationSections.primary[0].links.map((link) => (
                <button
                  key={link.path}
                  onClick={() => handleNavigation(link.path)}
                  className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  style={{ minHeight: '44px' }}
                >
                  <span className="text-lg">{link.icon}</span>
                  <span className="font-medium">{link.label}</span>
                </button>
              ))}
            </nav>

            {/* Secondary Navigation */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {navigationSections.secondary[0].title}
              </h3>
              <nav className="space-y-2" role="navigation" aria-label="Account navigation">
                {navigationSections.secondary[0].links.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleNavigation(link.path)}
                    className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </button>
                ))}
                
                {/* Logout button for authenticated users */}
                {isAuthenticated && (
                  <button
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="w-full flex items-center space-x-3 p-3 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="text-lg">🚪</span>
                    <span>{logoutMutation.isPending ? 'Signing out...' : 'Sign Out'}</span>
                  </button>
                )}
              </nav>
            </div>

            {/* Recent Products */}
            {recentProducts && recentProducts.products.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Recent Products
                </h3>
                <div className="space-y-2">
                  {recentProducts.products.map((product) => (
                    <button
                      key={product.product_id}
                      onClick={() => handleNavigation(`/products/${product.product_id}`)}
                      className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      style={{ minHeight: '44px' }}
                    >
                      <div className="flex-shrink-0 w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                        {product.primary_image ? (
                          <img
                            src={product.primary_image}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <span className="text-gray-400 text-xs">No img</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {product.sale_price ? (
                            <>
                              <span className="line-through text-gray-400">${product.price.toFixed(2)}</span>
                              <span className="ml-2 text-red-600">${product.sale_price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span>${product.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tertiary Navigation */}
            <div className="p-4 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {navigationSections.tertiary[0].title}
              </h3>
              <nav className="space-y-2" role="navigation" aria-label="Legal navigation">
                {navigationSections.tertiary[0].links.map((link) => (
                  <button
                    key={link.path}
                    onClick={() => handleNavigation(link.path)}
                    className="w-full flex items-center space-x-3 p-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    style={{ minHeight: '44px' }}
                  >
                    <span className="text-lg">{link.icon}</span>
                    <span>{link.label}</span>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default GV_MobileMenu;