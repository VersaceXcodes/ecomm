import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for API responses
interface ProductSearchResponse {
  products: {
    product_id: string;
    name: string;
    price: number;
    sale_price: number | null;
    primary_image?: {
      image_url: string;
      alt_text: string;
    };
  }[];
  total: number;
}

interface LogoutResponse {
  message: string;
}

const GV_TopNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Local state for search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  // Removed unused isSearching state
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global state access - CRITICAL: Individual selectors to avoid infinite loops
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const cartItemCount = useAppStore(state => state.cart_state.total_quantity);
  const cartTotal = useAppStore(state => state.cart_state.total);
  const isMobileMenuOpen = useAppStore(state => state.ui_state.mobile_menu_open);
  // Removed unused isCartSidebarOpen
  const currentBreakpoint = useAppStore(state => state.ui_state.current_breakpoint);
  
  // Global state actions
  const toggleMobileMenu = useAppStore(state => state.toggle_mobile_menu);
  const toggleCartSidebar = useAppStore(state => state.toggle_cart_sidebar);
  const setSearchQueryGlobal = useAppStore(state => state.set_search_query);
  const clearAuthenticationState = useAppStore(state => state.clear_authentication_state);
  const setAuthToken = useAppStore(state => state.set_auth_token);

  // Search suggestions query with debouncing
  const { data: searchSuggestions = [] } = useQuery({
    queryKey: ['search-suggestions', searchQuery],
    queryFn: async (): Promise<string[]> => {
      if (!searchQuery.trim() || searchQuery.length < 2) return [];
      
      const response = await axios.get<ProductSearchResponse>(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/products`,
        {
          params: {
            search_query: searchQuery,
            limit: 5,
            offset: 0
          }
        }
      );
      
      return response.data.products.map(product => product.name);
    },
    enabled: searchQuery.length >= 2 && showSearchSuggestions,
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: false,
  });

  // Logout mutation
  const handleLogout = async () => {
    try {
      const authToken = useAppStore.getState().authentication_state.auth_token;
      
      if (authToken) {
        await axios.post<LogoutResponse>(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/logout`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          }
        );
      }
      
      // Clear authentication state
      clearAuthenticationState();
      setAuthToken(null);
      
      // Navigate to home page
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if API call fails
      clearAuthenticationState();
      setAuthToken(null);
      navigate('/');
    }
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchQueryGlobal(searchQuery);
      setShowSearchSuggestions(false);
      navigate(`/products?search_query=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle search suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setSearchQueryGlobal(suggestion);
    setShowSearchSuggestions(false);
    navigate(`/products?search_query=${encodeURIComponent(suggestion)}`);
  };

  // Handle search input changes with debouncing
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.length >= 2) {
      setShowSearchSuggestions(true);
    } else {
      setShowSearchSuggestions(false);
    }
  };

  // Close search suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect screen size for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const breakpoint = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
      
      if (breakpoint !== currentBreakpoint) {
        useAppStore.getState().set_current_breakpoint(breakpoint);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentBreakpoint]);

  // Check if current path is active
  const isActivePath = (path: string): boolean => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isMobile = currentBreakpoint === 'mobile';

  return (
    <>
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo */}
            <div className="flex-shrink-0">
              <Link 
                to="/" 
                className="flex items-center"
                aria-label="PerfumeShop Homepage"
              >
                <div className="text-2xl font-bold text-blue-600 hover:text-blue-700 transition-colors">
                  PerfumeShop
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            {!isMobile && (
              <>
                {/* Main Navigation Links */}
                <nav className="hidden md:flex space-x-8" role="navigation">
                  <Link
                    to="/products"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/products')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    Products
                  </Link>
                  <Link
                    to="/about"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/about')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActivePath('/contact')
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    Contact
                  </Link>
                </nav>

                {/* Search Bar */}
                <div className="flex-1 max-w-lg mx-8" ref={searchRef}>
                  <form onSubmit={handleSearchSubmit} className="relative">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      placeholder="Search perfumes..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      onFocus={() => {
                        if (searchQuery.length >= 2) {
                          setShowSearchSuggestions(true);
                        }
                      }}
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    
                    {/* Search Suggestions Dropdown */}
                    {showSearchSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                </div>
              </>
            )}

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Mobile Search Icon */}
              {isMobile && (
                <button
                  onClick={() => searchInputRef.current?.focus()}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Search"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              )}

              {/* Cart Icon with Badge */}
              <button
                onClick={toggleCartSidebar}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors group"
                aria-label={`Shopping cart with ${cartItemCount} items`}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 4M7 13v4a2 2 0 002 2h8.5m0 0a2 2 0 002-2V9H9" />
                </svg>
                
                {/* Cart Item Count Badge */}
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
                
                {/* Cart Total Hover Tooltip - Desktop Only */}
                {!isMobile && cartTotal > 0 && (
                  <div className="absolute right-0 top-full mt-2 px-3 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    Total: ${cartTotal.toFixed(2)}
                  </div>
                )}
              </button>

              {/* User Account Area */}
              {isAuthenticated && currentUser ? (
                <div className="relative group">
                  <button
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
                    aria-label="User account menu"
                  >
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">
                        {currentUser.first_name?.[0]?.toUpperCase() || currentUser.email[0].toUpperCase()}
                      </span>
                    </div>
                    {!isMobile && (
                      <span className="text-sm font-medium">
                        {currentUser.first_name || 'Account'}
                      </span>
                    )}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* User Dropdown Menu */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto z-50">
                    <div className="py-1">
                      <Link
                        to="/account"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/account/orders"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Orders
                      </Link>
                      <Link
                        to="/account/wishlist"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Wishlist
                      </Link>
                      <Link
                        to="/account/addresses"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        Addresses
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Menu Hamburger */}
              {isMobile && (
                <button
                  onClick={toggleMobileMenu}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Toggle mobile menu"
                  aria-expanded={isMobileMenuOpen}
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isMobile && (
            <div className="pb-4" ref={searchRef}>
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search perfumes..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onFocus={() => {
                    if (searchQuery.length >= 2) {
                      setShowSearchSuggestions(true);
                    }
                  }}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                
                {/* Mobile Search Suggestions */}
                {showSearchSuggestions && searchSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    {searchSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </form>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default GV_TopNavigation;