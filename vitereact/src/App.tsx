import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Global Views - Keep these as regular imports since they're used frequently
import GV_TopNavigation from '@/components/views/GV_TopNavigation';
import GV_Footer from '@/components/views/GV_Footer';
import GV_CartSidebar from '@/components/views/GV_CartSidebar';
import GV_MobileMenu from '@/components/views/GV_MobileMenu';

// Lazy load unique views for better performance
const UV_Landing = lazy(() => import('@/components/views/UV_Landing'));
const UV_ProductListing = lazy(() => import('@/components/views/UV_ProductListing'));
const UV_ProductDetail = lazy(() => import('@/components/views/UV_ProductDetail'));
const UV_FullCart = lazy(() => import('@/components/views/UV_FullCart'));
const UV_Login = lazy(() => import('@/components/views/UV_Login'));
const UV_Registration = lazy(() => import('@/components/views/UV_Registration'));
const UV_UserDashboard = lazy(() => import('@/components/views/UV_UserDashboard'));
const UV_OrderHistory = lazy(() => import('@/components/views/UV_OrderHistory'));
const UV_AddressBook = lazy(() => import('@/components/views/UV_AddressBook'));
const UV_Wishlist = lazy(() => import('@/components/views/UV_Wishlist'));
const UV_CheckoutShipping = lazy(() => import('@/components/views/UV_CheckoutShipping'));
const UV_CheckoutPayment = lazy(() => import('@/components/views/UV_CheckoutPayment'));
const UV_CheckoutReview = lazy(() => import('@/components/views/UV_CheckoutReview'));
const UV_OrderConfirmation = lazy(() => import('@/components/views/UV_OrderConfirmation'));
const UV_AdminLogin = lazy(() => import('@/components/views/UV_AdminLogin'));
const UV_AdminProducts = lazy(() => import('@/components/views/UV_AdminProducts'));
const UV_AdminOrders = lazy(() => import('@/components/views/UV_AdminOrders'));
const UV_Contact = lazy(() => import('@/components/views/UV_Contact'));
const UV_About = lazy(() => import('@/components/views/UV_About'));
const UV_PrivacyPolicy = lazy(() => import('@/components/views/UV_PrivacyPolicy'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Loading component
const LoadingSpinner: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Protected route wrapper for customer authentication
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Protected route wrapper for admin authentication
const AdminProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAdminAuthenticated = useAppStore(state => state.admin_state.is_authenticated);
  
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
};

// Layout wrapper for customer pages
const CustomerLayout: React.FC<{ children: React.ReactNode; showCartSidebar?: boolean }> = ({ 
  children, 
  showCartSidebar = true 
}) => {
  return (
    <div className="min-h-screen flex flex-col">
      <GV_TopNavigation />
      <GV_MobileMenu />
      {showCartSidebar && <GV_CartSidebar />}
      <main className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
      <GV_Footer />
    </div>
  );
};

// Layout wrapper for admin pages
const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <main className="min-h-screen">
        <Suspense fallback={<LoadingSpinner />}>
          {children}
        </Suspense>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  const isLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const initializeStore = useAppStore(state => state.initialize_store);
  
  useEffect(() => {
    // Initialize store and auth state when app loads
    initializeStore();
  }, [initializeStore]);
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <div className="App">
          <Routes>
            {/* Public Customer Routes */}
            <Route 
              path="/" 
              element={
                <CustomerLayout>
                  <UV_Landing />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/products" 
              element={
                <CustomerLayout>
                  <UV_ProductListing />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/products/:product_id" 
              element={
                <CustomerLayout>
                  <UV_ProductDetail />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/cart" 
              element={
                <CustomerLayout showCartSidebar={false}>
                  <UV_FullCart />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/login" 
              element={
                <CustomerLayout showCartSidebar={false}>
                  <UV_Login />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/register" 
              element={
                <CustomerLayout showCartSidebar={false}>
                  <UV_Registration />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/contact" 
              element={
                <CustomerLayout>
                  <UV_Contact />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/about" 
              element={
                <CustomerLayout>
                  <UV_About />
                </CustomerLayout>
              } 
            />
            <Route 
              path="/privacy" 
              element={
                <CustomerLayout>
                  <UV_PrivacyPolicy />
                </CustomerLayout>
              } 
            />

            {/* Protected Customer Routes */}
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <UV_UserDashboard />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/orders" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <UV_OrderHistory />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/addresses" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <UV_AddressBook />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/account/wishlist" 
              element={
                <ProtectedRoute>
                  <CustomerLayout>
                    <UV_Wishlist />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />

            {/* Checkout Routes - Protected */}
            <Route 
              path="/checkout/shipping" 
              element={
                <ProtectedRoute>
                  <CustomerLayout showCartSidebar={false}>
                    <UV_CheckoutShipping />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/payment" 
              element={
                <ProtectedRoute>
                  <CustomerLayout showCartSidebar={false}>
                    <UV_CheckoutPayment />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/review" 
              element={
                <ProtectedRoute>
                  <CustomerLayout showCartSidebar={false}>
                    <UV_CheckoutReview />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/checkout/confirmation" 
              element={
                <ProtectedRoute>
                  <CustomerLayout showCartSidebar={false}>
                    <UV_OrderConfirmation />
                  </CustomerLayout>
                </ProtectedRoute>
              } 
            />

            {/* Admin Routes */}
            <Route 
              path="/admin/login" 
              element={
                <AdminLayout>
                  <UV_AdminLogin />
                </AdminLayout>
              } 
            />
            <Route 
              path="/admin/products" 
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <UV_AdminProducts />
                  </AdminLayout>
                </AdminProtectedRoute>
              } 
            />
            <Route 
              path="/admin/orders" 
              element={
                <AdminProtectedRoute>
                  <AdminLayout>
                    <UV_AdminOrders />
                  </AdminLayout>
                </AdminProtectedRoute>
              } 
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </QueryClientProvider>
    </Router>
  );
};

export default App;