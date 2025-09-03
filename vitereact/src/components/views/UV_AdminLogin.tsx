import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for admin login
interface AdminLoginRequest {
  username: string;
  password: string;
}

interface AdminLoginResponse {
  admin: {
    admin_id: string;
    username: string;
    email: string;
    role: string;
    permissions: string[];
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  token: string;
  expires_at: string;
}

interface Verify2FARequest {
  username: string;
  code: string;
}

const UV_AdminLogin: React.FC = () => {
  // Local state variables matching the specification
  const [adminCredentials, setAdminCredentials] = useState({ username: '', password: '' });
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [require2FA, setRequire2FA] = useState(false);

  const navigate = useNavigate();

  // Zustand store selectors - individual selectors to avoid infinite loops
  const isAdminAuthenticated = useAppStore(state => state.admin_state.is_authenticated);
  const setCurrentAdmin = useAppStore(state => state.set_current_admin);
  const setAdminToken = useAppStore(state => state.set_admin_token);
  const setAdminAuthenticated = useAppStore(state => state.set_admin_authenticated);
  const setAdminPermissions = useAppStore(state => state.set_admin_permissions);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin/products');
    }
  }, [isAdminAuthenticated, navigate]);

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async (credentials: AdminLoginRequest): Promise<AdminLoginResponse> => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/auth/login`,
        credentials
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update global admin state
      setCurrentAdmin(data.admin);
      setAdminToken(data.token);
      setAdminAuthenticated(true);
      setAdminPermissions(data.admin.permissions);
      
      // Clear local state
      setAdminLoginError(null);
      setLoginAttempts(0);
      setLoggingIn(false);
      
      // Navigate to admin dashboard
      navigate('/admin/products');
    },
    onError: (error: any) => {
      setLoggingIn(false);
      setLoginAttempts(prev => prev + 1);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          setAdminLoginError('Invalid username or password. Please try again.');
        } else if (error.response?.status === 423) {
          setAdminLoginError('Account temporarily locked due to multiple failed attempts.');
        } else if (error.response?.data?.message) {
          setAdminLoginError(error.response.data.message);
        } else {
          setAdminLoginError('Authentication failed. Please try again.');
        }
      } else {
        setAdminLoginError('Network error. Please check your connection and try again.');
      }
    }
  });

  // 2FA verification mutation (placeholder for future implementation)
  const verify2FAMutation = useMutation({
    mutationFn: async (data: Verify2FARequest) => {
      // This endpoint is noted as missing in the specification
      // Implementation ready for when endpoint becomes available
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/admin/auth/verify-2fa`,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      setRequire2FA(false);
      setTwoFactorCode('');
      // Continue with normal login flow
    },
    onError: (error: any) => {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        setAdminLoginError(error.response.data.message);
      } else {
        setAdminLoginError('2FA verification failed. Please try again.');
      }
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setAdminLoginError(null);
    
    // Basic validation
    if (!adminCredentials.username.trim() || !adminCredentials.password.trim()) {
      setAdminLoginError('Please enter both username and password.');
      return;
    }

    // Check attempt limit
    if (loginAttempts >= 5) {
      setAdminLoginError('Too many failed attempts. Please wait before trying again.');
      return;
    }

    setLoggingIn(true);
    
    try {
      await adminLoginMutation.mutateAsync(adminCredentials);
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  const handle2FAVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!twoFactorCode.trim()) {
      setAdminLoginError('Please enter the 2FA verification code.');
      return;
    }

    try {
      await verify2FAMutation.mutateAsync({
        username: adminCredentials.username,
        code: twoFactorCode
      });
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  const clearError = () => {
    setAdminLoginError(null);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center mb-6">
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">
              Admin Portal
            </h2>
            <p className="text-slate-300 text-sm">
              Secure administrative access to PerfumeShop management system
            </p>
          </div>

          {/* Security Status Indicator */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div className="flex-1">
                <p className="text-slate-300 text-xs">
                  Secure Connection Active • Enhanced Security Enabled
                </p>
              </div>
              <div className="text-slate-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            {!require2FA ? (
              <form className="space-y-6" onSubmit={handleLogin}>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Administrator Login
                  </h3>
                </div>

                {/* Error Message */}
                {adminLoginError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-red-800">{adminLoginError}</p>
                        <button
                          type="button"
                          onClick={clearError}
                          className="text-red-600 hover:text-red-500 text-xs mt-1 underline"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Failed Attempts Warning */}
                {loginAttempts > 0 && loginAttempts < 5 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                    <p className="text-yellow-800 text-sm">
                      <strong>Security Notice:</strong> {loginAttempts} failed attempt{loginAttempts > 1 ? 's' : ''}. 
                      {5 - loginAttempts} attempt{(5 - loginAttempts) > 1 ? 's' : ''} remaining.
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Username Field */}
                  <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={adminCredentials.username}
                      onChange={(e) => {
                        setAdminCredentials(prev => ({ ...prev, username: e.target.value }));
                        clearError();
                      }}
                      placeholder="Enter admin username"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={loggingIn}
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={adminCredentials.password}
                      onChange={(e) => {
                        setAdminCredentials(prev => ({ ...prev, password: e.target.value }));
                        clearError();
                      }}
                      placeholder="Enter admin password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      disabled={loggingIn}
                    />
                  </div>
                </div>

                {/* Login Button */}
                <div>
                  <button
                    type="submit"
                    disabled={loggingIn || loginAttempts >= 5}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loggingIn ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Authenticating...
                      </span>
                    ) : (
                      'Sign In to Admin Portal'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              /* 2FA Form */
              <form className="space-y-6" onSubmit={handle2FAVerification}>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Two-Factor Authentication
                  </h3>
                  <p className="text-sm text-gray-600">
                    Enter the 6-digit verification code from your authenticator app.
                  </p>
                </div>

                {adminLoginError && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-sm text-red-800">{adminLoginError}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="twoFactorCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    id="twoFactorCode"
                    name="twoFactorCode"
                    type="text"
                    maxLength={6}
                    pattern="[0-9]{6}"
                    required
                    value={twoFactorCode}
                    onChange={(e) => {
                      setTwoFactorCode(e.target.value.replace(/\D/g, ''));
                      clearError();
                    }}
                    placeholder="000000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-lg tracking-widest"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    type="submit"
                    disabled={verify2FAMutation.isPending || twoFactorCode.length !== 6}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {verify2FAMutation.isPending ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Verifying...
                      </span>
                    ) : (
                      'Verify & Continue'
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRequire2FA(false);
                      setTwoFactorCode('');
                      setAdminLoginError(null);
                    }}
                    className="w-full text-center text-sm text-gray-600 hover:text-gray-800"
                  >
                    ← Back to login
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Support Information */}
          <div className="text-center">
            <p className="text-slate-400 text-xs">
              Need help accessing your admin account?
            </p>
            <p className="text-slate-300 text-xs mt-1">
              Contact IT Support: admin-support@perfumeshop.com
            </p>
          </div>

          {/* Security Footer */}
          <div className="text-center text-xs text-slate-500">
            <p>Protected by enterprise-grade security</p>
            <p className="mt-1">All login attempts are monitored and logged</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_AdminLogin;