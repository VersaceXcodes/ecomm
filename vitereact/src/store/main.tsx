import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types based on OpenAPI schemas
export interface User {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  admin_id: string;
  username: string;
  email: string;
  role: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  cart_item_id: string;
  user_id: string | null;
  session_id: string | null;
  product_id: string;
  quantity: number;
  added_at: string;
  updated_at: string;
  product?: {
    product_id: string;
    name: string;
    price: number;
    sale_price: number | null;
    brand: string;
    image_url?: string;
  };
  line_total?: number;
}

export interface AuthenticationState {
  current_user: User | null;
  auth_token: string | null;
  authentication_status: {
    is_authenticated: boolean;
    is_loading: boolean;
  };
  error_message: string | null;
}

export interface CartState {
  items: CartItem[];
  total_quantity: number;
  subtotal: number;
  total: number;
  shipping_cost: number;
  tax_amount: number;
  is_loading: boolean;
}

export interface UIState {
  mobile_menu_open: boolean;
  cart_sidebar_open: boolean;
  search_modal_open: boolean;
  current_breakpoint: string;
}

export interface ProductFilters {
  search_query: string;
  price_min: number | null;
  price_max: number | null;
  sort_by: string;
  category: string | null;
  results_count: number;
}

export interface AdminState {
  current_admin: AdminUser | null;
  admin_token: string | null;
  is_authenticated: boolean;
  permissions: string[];
}

export interface AppState {
  // State objects
  authentication_state: AuthenticationState;
  cart_state: CartState;
  ui_state: UIState;
  product_filters: ProductFilters;
  admin_state: AdminState;
  
  // Session management
  session_id: string;
  
  // Authentication actions
  set_authentication_state: (authState: Partial<AuthenticationState>) => void;
  set_current_user: (user: User | null) => void;
  set_auth_token: (token: string | null) => void;
  set_authentication_loading: (loading: boolean) => void;
  set_authentication_error: (error: string | null) => void;
  clear_authentication_state: () => void;
  
  // Cart actions
  set_cart_state: (cartState: Partial<CartState>) => void;
  set_cart_items: (items: CartItem[]) => void;
  set_cart_loading: (loading: boolean) => void;
  update_cart_totals: (totals: { total_quantity?: number; subtotal?: number; total?: number; shipping_cost?: number; tax_amount?: number }) => void;
  clear_cart_state: () => void;
  
  // UI actions
  set_ui_state: (uiState: Partial<UIState>) => void;
  toggle_mobile_menu: () => void;
  toggle_cart_sidebar: () => void;
  toggle_search_modal: () => void;
  set_current_breakpoint: (breakpoint: string) => void;
  close_all_modals: () => void;
  
  // Product filters actions
  set_product_filters: (filters: Partial<ProductFilters>) => void;
  set_search_query: (query: string) => void;
  set_price_filter: (min: number | null, max: number | null) => void;
  set_sort_by: (sortBy: string) => void;
  set_category_filter: (category: string | null) => void;
  set_results_count: (count: number) => void;
  clear_product_filters: () => void;
  
  // Admin actions
  set_admin_state: (adminState: Partial<AdminState>) => void;
  set_current_admin: (admin: AdminUser | null) => void;
  set_admin_token: (token: string | null) => void;
  set_admin_authenticated: (authenticated: boolean) => void;
  set_admin_permissions: (permissions: string[]) => void;
  clear_admin_state: () => void;
  
  // Session actions
  generate_session_id: () => void;
  set_session_id: (sessionId: string) => void;
  
  // Utility actions
  initialize_store: () => void;
}

// Helper function to generate session ID
const generateSessionId = (): string => {
  return 'sess_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36);
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      authentication_state: {
        current_user: null,
        auth_token: null,
        authentication_status: {
          is_authenticated: false,
          is_loading: true,
        },
        error_message: null,
      },
      
      cart_state: {
        items: [],
        total_quantity: 0,
        subtotal: 0,
        total: 0,
        shipping_cost: 0,
        tax_amount: 0,
        is_loading: false,
      },
      
      ui_state: {
        mobile_menu_open: false,
        cart_sidebar_open: false,
        search_modal_open: false,
        current_breakpoint: 'desktop',
      },
      
      product_filters: {
        search_query: '',
        price_min: null,
        price_max: null,
        sort_by: 'name',
        category: null,
        results_count: 0,
      },
      
      admin_state: {
        current_admin: null,
        admin_token: null,
        is_authenticated: false,
        permissions: [],
      },
      
      session_id: generateSessionId(),
      
      // Authentication actions
      set_authentication_state: (authState) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            ...authState,
          },
        }));
      },
      
      set_current_user: (user) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            current_user: user,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_authenticated: !!user && !!state.authentication_state.auth_token,
            },
          },
        }));
      },
      
      set_auth_token: (token) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            auth_token: token,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_authenticated: !!token && !!state.authentication_state.current_user,
            },
          },
        }));
      },
      
      set_authentication_loading: (loading) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            authentication_status: {
              ...state.authentication_state.authentication_status,
              is_loading: loading,
            },
          },
        }));
      },
      
      set_authentication_error: (error) => {
        set((state) => ({
          authentication_state: {
            ...state.authentication_state,
            error_message: error,
          },
        }));
      },
      
      clear_authentication_state: () => {
        set(() => ({
          authentication_state: {
            current_user: null,
            auth_token: null,
            authentication_status: {
              is_authenticated: false,
              is_loading: false,
            },
            error_message: null,
          },
        }));
      },
      
      // Cart actions
      set_cart_state: (cartState) => {
        set((state) => ({
          cart_state: {
            ...state.cart_state,
            ...cartState,
          },
        }));
      },
      
      set_cart_items: (items) => {
        const total_quantity = items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = items.reduce((sum, item) => {
          const price = item.product?.sale_price || item.product?.price || 0;
          return sum + (price * item.quantity);
        }, 0);
        
        set((state) => ({
          cart_state: {
            ...state.cart_state,
            items,
            total_quantity,
            subtotal,
            total: subtotal + state.cart_state.shipping_cost + state.cart_state.tax_amount,
          },
        }));
      },
      
      set_cart_loading: (loading) => {
        set((state) => ({
          cart_state: {
            ...state.cart_state,
            is_loading: loading,
          },
        }));
      },
      
      update_cart_totals: (totals) => {
        set((state) => ({
          cart_state: {
            ...state.cart_state,
            ...totals,
          },
        }));
      },
      
      clear_cart_state: () => {
        set(() => ({
          cart_state: {
            items: [],
            total_quantity: 0,
            subtotal: 0,
            total: 0,
            shipping_cost: 0,
            tax_amount: 0,
            is_loading: false,
          },
        }));
      },
      
      // UI actions
      set_ui_state: (uiState) => {
        set((state) => ({
          ui_state: {
            ...state.ui_state,
            ...uiState,
          },
        }));
      },
      
      toggle_mobile_menu: () => {
        set((state) => ({
          ui_state: {
            ...state.ui_state,
            mobile_menu_open: !state.ui_state.mobile_menu_open,
          },
        }));
      },
      
      toggle_cart_sidebar: () => {
        set((state) => ({
          ui_state: {
            ...state.ui_state,
            cart_sidebar_open: !state.ui_state.cart_sidebar_open,
          },
        }));
      },
      
      toggle_search_modal: () => {
        set((state) => ({
          ui_state: {
            ...state.ui_state,
            search_modal_open: !state.ui_state.search_modal_open,
          },
        }));
      },
      
      set_current_breakpoint: (breakpoint) => {
        set((state) => ({
          ui_state: {
            ...state.ui_state,
            current_breakpoint: breakpoint,
          },
        }));
      },
      
      close_all_modals: () => {
        set((state) => ({
          ui_state: {
            ...state.ui_state,
            mobile_menu_open: false,
            cart_sidebar_open: false,
            search_modal_open: false,
          },
        }));
      },
      
      // Product filters actions
      set_product_filters: (filters) => {
        set((state) => ({
          product_filters: {
            ...state.product_filters,
            ...filters,
          },
        }));
      },
      
      set_search_query: (query) => {
        set((state) => ({
          product_filters: {
            ...state.product_filters,
            search_query: query,
          },
        }));
      },
      
      set_price_filter: (min, max) => {
        set((state) => ({
          product_filters: {
            ...state.product_filters,
            price_min: min,
            price_max: max,
          },
        }));
      },
      
      set_sort_by: (sortBy) => {
        set((state) => ({
          product_filters: {
            ...state.product_filters,
            sort_by: sortBy,
          },
        }));
      },
      
      set_category_filter: (category) => {
        set((state) => ({
          product_filters: {
            ...state.product_filters,
            category,
          },
        }));
      },
      
      set_results_count: (count) => {
        set((state) => ({
          product_filters: {
            ...state.product_filters,
            results_count: count,
          },
        }));
      },
      
      clear_product_filters: () => {
        set(() => ({
          product_filters: {
            search_query: '',
            price_min: null,
            price_max: null,
            sort_by: 'name',
            category: null,
            results_count: 0,
          },
        }));
      },
      
      // Admin actions
      set_admin_state: (adminState) => {
        set((state) => ({
          admin_state: {
            ...state.admin_state,
            ...adminState,
          },
        }));
      },
      
      set_current_admin: (admin) => {
        set((state) => ({
          admin_state: {
            ...state.admin_state,
            current_admin: admin,
            is_authenticated: !!admin && !!state.admin_state.admin_token,
            permissions: admin?.permissions || [],
          },
        }));
      },
      
      set_admin_token: (token) => {
        set((state) => ({
          admin_state: {
            ...state.admin_state,
            admin_token: token,
            is_authenticated: !!token && !!state.admin_state.current_admin,
          },
        }));
      },
      
      set_admin_authenticated: (authenticated) => {
        set((state) => ({
          admin_state: {
            ...state.admin_state,
            is_authenticated: authenticated,
          },
        }));
      },
      
      set_admin_permissions: (permissions) => {
        set((state) => ({
          admin_state: {
            ...state.admin_state,
            permissions,
          },
        }));
      },
      
      clear_admin_state: () => {
        set(() => ({
          admin_state: {
            current_admin: null,
            admin_token: null,
            is_authenticated: false,
            permissions: [],
          },
        }));
      },
      
      // Session actions
      generate_session_id: () => {
        set(() => ({
          session_id: generateSessionId(),
        }));
      },
      
      set_session_id: (sessionId) => {
        set(() => ({
          session_id: sessionId,
        }));
      },
      
      // Utility actions
      initialize_store: () => {
        const { authentication_state } = get();
        
        // Update derived authentication status
        if (authentication_state.current_user && authentication_state.auth_token) {
          set((state) => ({
            authentication_state: {
              ...state.authentication_state,
              authentication_status: {
                is_authenticated: true,
                is_loading: false,
              },
            },
          }));
        } else {
          set((state) => ({
            authentication_state: {
              ...state.authentication_state,
              authentication_status: {
                is_authenticated: false,
                is_loading: false,
              },
            },
          }));
        }
        
        // Generate session ID if not exists
        if (!get().session_id) {
          get().generate_session_id();
        }
      },
    }),
    {
      name: 'perfume-shop-storage',
      partialize: (state) => ({
        // Persist authentication state
        authentication_state: {
          current_user: state.authentication_state.current_user,
          auth_token: state.authentication_state.auth_token,
          authentication_status: {
            is_authenticated: state.authentication_state.authentication_status.is_authenticated,
            is_loading: false, // Never persist loading state
          },
          error_message: null, // Never persist errors
        },
        
        // Persist cart state for continuity
        cart_state: {
          items: state.cart_state.items,
          total_quantity: state.cart_state.total_quantity,
          subtotal: state.cart_state.subtotal,
          total: state.cart_state.total,
          shipping_cost: state.cart_state.shipping_cost,
          tax_amount: state.cart_state.tax_amount,
          is_loading: false, // Never persist loading state
        },
        
        // Persist product filters for user convenience
        product_filters: state.product_filters,
        
        // Persist admin auth state
        admin_state: {
          current_admin: state.admin_state.current_admin,
          admin_token: state.admin_state.admin_token,
          is_authenticated: state.admin_state.is_authenticated,
          permissions: state.admin_state.permissions,
        },
        
        // Persist session ID
        session_id: state.session_id,
        
        // UI state is not persisted (should reset on refresh)
      }),
    }
  )
);

// Export types for component consumption - removed duplicate exports