import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for API request and response
interface RegisterRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

interface RegisterResponse {
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

const UV_Registration: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect_to') || '/account';

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  // UI state
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Zustand store access - using individual selectors to avoid infinite loops
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const setCurrentUser = useAppStore(state => state.set_current_user);
  const setAuthToken = useAppStore(state => state.set_auth_token);
  const setAuthenticationLoading = useAppStore(state => state.set_authentication_loading);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  // Password strength validation
  const checkPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    const criteriaCount = [hasLower, hasUpper, hasNumber, hasSpecial, isLongEnough].filter(Boolean).length;
    
    if (criteriaCount >= 4) return 'strong';
    if (criteriaCount >= 2) return 'medium';
    return 'weak';
  };

  // Email validation
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest): Promise<RegisterResponse> => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/auth/register`,
        data,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      // Update global authentication state
      setCurrentUser(data.user);
      setAuthToken(data.token);
      setAuthenticationLoading(false);
      
      // Navigate to intended destination
      navigate(redirectTo);
    },
    onError: (error: any) => {
      setAuthenticationLoading(false);
      const errorMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      setFormError(errorMessage);
    },
  });

  // Handle password input change
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordError(null);
    setFormError(null);
    setPasswordStrength(checkPasswordStrength(value));
    
    if (value && value.length > 0) {
      setShowPasswordRequirements(true);
    }
  };

  // Handle email input change
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError(null);
    setFormError(null);
    
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    }
  };

  // Handle password confirmation change
  const handlePasswordConfirmationChange = (value: string) => {
    setPasswordConfirmation(value);
    setPasswordError(null);
    setFormError(null);
    
    if (value && password && value !== password) {
      setPasswordError('Passwords do not match');
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Validation
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (password !== passwordConfirmation) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    if (passwordStrength === 'weak') {
      setPasswordError('Password is too weak. Please choose a stronger password.');
      return;
    }
    
    if (!termsAccepted || !privacyAccepted) {
      setFormError('You must accept the Terms of Service and Privacy Policy to continue');
      return;
    }
    
    // Prepare registration data
    const registrationData: RegisterRequest = {
      email: email.trim(),
      password,
      first_name: firstName.trim(),
      last_name: lastName.trim(),
    };
    
    if (phone.trim()) {
      registrationData.phone = phone.trim();
    }
    
    setAuthenticationLoading(true);
    registerMutation.mutate(registrationData);
  };

  const isLoading = registerMutation.isPending;

  return (
    <>
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join PerfumeShop for exclusive benefits
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {/* Account Benefits */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Account Benefits</h3>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Faster checkout with saved information</li>
                <li>• Order tracking and history</li>
                <li>• Exclusive member offers</li>
                <li>• Wishlist and favorites</li>
              </ul>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Error Display */}
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert" aria-live="polite">
                  <p className="text-sm">{formError}</p>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      autoComplete="given-name"
                      required
                      value={firstName}
                      onChange={(e) => {
                        setFirstName(e.target.value);
                        setFormError(null);
                      }}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px]"
                      placeholder="John"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <div className="mt-1">
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      required
                      value={lastName}
                      onChange={(e) => {
                        setLastName(e.target.value);
                        setFormError(null);
                      }}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px]"
                      placeholder="Doe"
                    />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px] ${
                      emailError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="john@example.com"
                    aria-invalid={emailError ? 'true' : 'false'}
                    aria-describedby={emailError ? 'email-error' : undefined}
                  />
                </div>
                {emailError && (
                  <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number <span className="text-gray-400">(Optional)</span>
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      setFormError(null);
                    }}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px]"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    onFocus={() => setShowPasswordRequirements(true)}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px] ${
                      passwordError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Enter a strong password"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby="password-requirements"
                  />
                </div>
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength === 'strong'
                              ? 'bg-green-500 w-full'
                              : passwordStrength === 'medium'
                              ? 'bg-yellow-500 w-2/3'
                              : 'bg-red-500 w-1/3'
                          }`}
                        />
                      </div>
                      <span
                        className={`text-xs font-medium ${
                          passwordStrength === 'strong'
                            ? 'text-green-600'
                            : passwordStrength === 'medium'
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {passwordStrength === 'strong' ? 'Strong' : passwordStrength === 'medium' ? 'Medium' : 'Weak'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Password Requirements */}
                {showPasswordRequirements && (
                  <div id="password-requirements" className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs font-medium text-gray-700 mb-2">Password requirements:</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className={password.length >= 8 ? 'text-green-600' : 'text-gray-600'}>
                        {password.length >= 8 ? '✓' : '•'} At least 8 characters
                      </li>
                      <li className={/[a-z]/.test(password) ? 'text-green-600' : 'text-gray-600'}>
                        {/[a-z]/.test(password) ? '✓' : '•'} One lowercase letter
                      </li>
                      <li className={/[A-Z]/.test(password) ? 'text-green-600' : 'text-gray-600'}>
                        {/[A-Z]/.test(password) ? '✓' : '•'} One uppercase letter
                      </li>
                      <li className={/\d/.test(password) ? 'text-green-600' : 'text-gray-600'}>
                        {/\d/.test(password) ? '✓' : '•'} One number
                      </li>
                      <li className={/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-600' : 'text-gray-600'}>
                        {/[!@#$%^&*(),.?":{}|<>]/.test(password) ? '✓' : '•'} One special character
                      </li>
                    </ul>
                  </div>
                )}

                {passwordError && (
                  <p className="mt-1 text-sm text-red-600" role="alert">
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Password Confirmation */}
              <div>
                <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="mt-1">
                  <input
                    id="passwordConfirmation"
                    name="passwordConfirmation"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={passwordConfirmation}
                    onChange={(e) => handlePasswordConfirmationChange(e.target.value)}
                    className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm min-h-[44px] ${
                      passwordError ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Re-enter your password"
                    aria-invalid={passwordError ? 'true' : 'false'}
                  />
                </div>
              </div>

              {/* Legal Compliance */}
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="terms"
                      name="terms"
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => {
                        setTermsAccepted(e.target.checked);
                        setFormError(null);
                      }}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded min-h-[44px] min-w-[44px] sm:h-4 sm:w-4 sm:min-h-0 sm:min-w-0"
                      aria-describedby="terms-description"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="terms" className="font-medium text-gray-700">
                      I accept the{' '}
                      <Link to="/terms" className="text-blue-600 hover:text-blue-500 underline">
                        Terms of Service
                      </Link>
                      *
                    </label>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="privacy"
                      name="privacy"
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={(e) => {
                        setPrivacyAccepted(e.target.checked);
                        setFormError(null);
                      }}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded min-h-[44px] min-w-[44px] sm:h-4 sm:w-4 sm:min-h-0 sm:min-w-0"
                      aria-describedby="privacy-description"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="privacy" className="font-medium text-gray-700">
                      I accept the{' '}
                      <Link to="/privacy" className="text-blue-600 hover:text-blue-500 underline">
                        Privacy Policy
                      </Link>
                      *
                    </label>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isLoading || !termsAccepted || !privacyAccepted}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </div>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    to={`/login${redirectTo !== '/account' ? `?redirect_to=${encodeURIComponent(redirectTo)}` : ''}`}
                    className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>

            {/* Data Protection Notice */}
            <div className="mt-6 p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600 text-center">
                🔒 Your personal information is protected and will never be shared with third parties.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_Registration;