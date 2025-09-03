import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';

// Global Views
import GV_TopNavigation from '@/components/views/GV_TopNavigation';
import GV_Footer from '@/components/views/GV_Footer';
import GV_CartSidebar from '@/components/views/GV_CartSidebar';
import GV_MobileMenu from '@/components/views/GV_MobileMenu';

// Unique Views
import UV_Landing from '@/components/views/UV_Landing';
import UV_ProductListing from '@/components/views/UV_ProductListing';
import UV_ProductDetail from '@/components/views/UV_ProductDetail';
import UV_FullCart from '@/components/views/UV_FullCart';
import UV_Login from '@/components/views/UV_Login';
import UV_Registration from '@/components/views/UV_Registration';
import UV_UserDashboard from '@/components/views/UV_UserDashboard';
import UV_OrderHistory from '@/components/views/UV_OrderHistory';
import UV_AddressBook from '@/components/views/UV_AddressBook';
import UV_Wishlist from '@/components/views/UV_Wishlist';
import UV_CheckoutShipping from '@/components/views/UV_CheckoutShipping';
import UV_CheckoutPayment from '@/components/views/UV_CheckoutPayment';
import UV_CheckoutReview from '@/components/views/UV_CheckoutReview';
import UV_OrderConfirmation from '@/components/views/UV_OrderConfirmation';
import UV_AdminLogin from '@/components/views/UV_AdminLogin';
import UV_AdminProducts from '@/components/views/UV_AdminProducts';
import UV_AdminOrders from '@/components/views/UV_AdminOrders';
import UV_Contact from '@/components/views/UV_Contact';
import UV_About from '@/components/views/UV_About';
import UV_PrivacyPolicy from '@/components/views/UV_PrivacyPolicy';

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
        {children}
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
        {children}
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