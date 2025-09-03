import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for API requests and responses
interface LoginRequest {
  email: string;
  password: string;
  remember_me: boolean;
}

interface LoginResponse {
  user: {
    user_id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    email_verified: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  token: string;
  expires_at: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  message: string;
}

// API functions
const loginUser = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/login`,
    data
  );
  return response.data;
};

const forgotPassword = async (data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> => {
  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/forgot-password`,
    data
  );
  return response.data;
};

const UV_Login: React.FC = () => {
  // URL parameters
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const redirectTo = searchParams.get('redirect_to');

  // Local state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState(false);

  // Global state selectors (individual selectors to avoid infinite loops)
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const authLoading = useAppStore(state => state.authentication_state.authentication_status.is_loading);
  const setAuthenticationState = useAppStore(state => state.set_authentication_state);
  const setCurrentUser = useAppStore(state => state.set_current_user);
  const setAuthToken = useAppStore(state => state.set_auth_token);
  const setAuthenticationLoading = useAppStore(state => state.set_authentication_loading);
  const setAuthenticationError = useAppStore(state => state.set_authentication_error);
  const sessionId = useAppStore(state => state.session_id);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const redirectUrl = redirectTo || '/account';
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, authLoading, redirectTo, navigate]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginUser,
    onMutate: () => {
      setAuthenticationLoading(true);
      setLoginError(null);
      setAuthenticationError(null);
    },
    onSuccess: (data) => {
      // Update global authentication state
      setCurrentUser(data.user);
      setAuthToken(data.token);
      
      // Store token in localStorage
      localStorage.setItem('auth_token', data.token);
      
      // Set authentication as complete
      setAuthenticationLoading(false);
      
      // TODO: Implement cart migration from guest session to user account
      // This would require a cart migration API endpoint
      
      // Redirect to intended destination
      const redirectUrl = redirectTo || '/account';
      navigate(redirectUrl, { replace: true });
    },
    onError: (error: any) => {
      setAuthenticationLoading(false);
      const errorMessage = error.response?.data?.message || 'Login failed. Please check your credentials.';
      setLoginError(errorMessage);
      setAuthenticationError(errorMessage);
    },
  });

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setForgotPasswordSuccess(true);
      setLoginError(null);
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to send reset email. Please try again.';
      setLoginError(errorMessage);
    },
  });

  // Form handlers
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setLoginError(null);
    
    // Basic validation
    if (!email.trim()) {
      setLoginError('Email is required');
      return;
    }
    
    if (!password.trim()) {
      setLoginError('Password is required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('Please enter a valid email address');
      return;
    }
    
    loginMutation.mutate({
      email: email.trim(),
      password,
      remember_me: rememberMe,
    });
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setLoginError(null);
    
    // Basic validation
    if (!email.trim()) {
      setLoginError('Email is required');
      return;
    }
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLoginError('Please enter a valid email address');
      return;
    }
    
    forgotPasswordMutation.mutate({
      email: email.trim(),
    });
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (loginError) setLoginError(null);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (loginError) setLoginError(null);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleForgotPasswordMode = () => {
    setForgotPasswordMode(!forgotPasswordMode);
    setForgotPasswordSuccess(false);
    setLoginError(null);
    setEmail('');
    setPassword('');
  };

  const isLoading = loginMutation.isPending || forgotPasswordMutation.isPending || authLoading;

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              {forgotPasswordMode ? 'Reset your password' : 'Sign in to your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {forgotPasswordMode ? (
                'Enter your email address and we\'ll send you a link to reset your password.'
              ) : (
                <>
                  Or{' '}
                  <Link
                    to={`/register${redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''}`}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    create a new account
                  </Link>
                </>
              )}
            </p>
          </div>

          {/* Form */}
          <form 
            className="mt-8 space-y-6" 
            onSubmit={forgotPasswordMode ? handleForgotPasswordSubmit : handleLoginSubmit}
          >
            {/* Error Message */}
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">{loginError}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message for Forgot Password */}
            {forgotPasswordSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">Password reset email sent! Check your inbox for further instructions.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="Email address"
                  className="relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                  disabled={isLoading}
                />
              </div>

              {/* Password Input (only show in login mode) */}
              {!forgotPasswordMode && (
                <div className="relative">
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={handlePasswordChange}
                    placeholder="Password"
                    className="relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              )}

              {/* Remember Me Checkbox (only show in login mode) */}
              {!forgotPasswordMode && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded transition-colors"
                      disabled={isLoading}
                    />
                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={toggleForgotPasswordMode}
                      className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                      disabled={isLoading}
                    >
                      Forgot your password?
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {forgotPasswordMode ? 'Sending...' : 'Signing in...'}
                  </span>
                ) : (
                  forgotPasswordMode ? 'Send reset email' : 'Sign in'
                )}
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="text-center">
              <button
                type="button"
                onClick={toggleForgotPasswordMode}
                className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
                disabled={isLoading}
              >
                {forgotPasswordMode ? 'Back to sign in' : 'Forgot password?'}
              </button>
            </div>
          </form>

          {/* Guest Checkout Option */}
          {!forgotPasswordMode && redirectTo?.includes('checkout') && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Or</span>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to="/checkout/shipping"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Continue as guest
                </Link>
              </div>
            </div>
          )}

          {/* Additional Links */}
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link
                to={`/register${redirectTo ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''}`}
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Sign up here
              </Link>
            </p>
            <p className="text-sm text-gray-600">
              Need help?{' '}
              <Link
                to="/contact"
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Contact support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Login;