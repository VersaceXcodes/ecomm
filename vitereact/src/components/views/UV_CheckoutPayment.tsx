import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types for payment processing
interface CreditCardForm {
  card_number: string;
  expiry_month: string;
  expiry_year: string;
  cvv: string;
  cardholder_name: string;
}

interface BillingAddress {
  address_id?: string;
  user_id: string;
  type: string;
  first_name: string;
  last_name: string;
  street_address_1: string;
  street_address_2?: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
}

interface SavedPaymentMethod {
  payment_method_id: string;
  type: string;
  last_four: string;
  expiry_month: string;
  expiry_year: string;
  cardholder_name: string;
}

interface PaymentValidationRequest {
  payment_method_type: string;
  card_details?: CreditCardForm;
  billing_address: BillingAddress;
}

interface PaymentValidationResponse {
  valid: boolean;
  errors?: string[];
  card_type?: string;
}

const UV_CheckoutPayment: React.FC = () => {
  const navigate = useNavigate();
  
  // Global state access with individual selectors
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const cartItems = useAppStore(state => state.cart_state.items);
  const cartTotal = useAppStore(state => state.cart_state.total);
  const isMobile = useAppStore(state => state.ui_state.current_breakpoint === 'mobile');

  // Local component state
  const [paymentMethod, setPaymentMethod] = useState<string>('credit_card');
  const [creditCardForm, setCreditCardForm] = useState<CreditCardForm>({
    card_number: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    cardholder_name: ''
  });
  const [billingAddress, setBillingAddress] = useState<BillingAddress | null>(null);
  const [sameAsShipping, setSameAsShipping] = useState<boolean>(true);
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedMethod, setSelectedSavedMethod] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [securityVerificationRequired, setSecurityVerificationRequired] = useState<boolean>(false);
  const [showCvvHelp, setShowCvvHelp] = useState<boolean>(false);
  const [cardType, setCardType] = useState<string>('');
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Detect card type from number
  const detectCardType = (cardNumber: string): string => {
    const cleaned = cardNumber.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^6(?:011|5)/.test(cleaned)) return 'discover';
    return '';
  };

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  // Validate credit card form
  const validateCreditCardForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    
    if (!creditCardForm.card_number || creditCardForm.card_number.replace(/\s/g, '').length < 13) {
      errors.card_number = 'Please enter a valid card number';
    }
    
    if (!creditCardForm.expiry_month || !creditCardForm.expiry_year) {
      errors.expiry = 'Please enter a valid expiry date';
    }
    
    if (!creditCardForm.cvv || creditCardForm.cvv.length < 3) {
      errors.cvv = 'Please enter a valid CVV';
    }
    
    if (!creditCardForm.cardholder_name.trim()) {
      errors.cardholder_name = 'Please enter the cardholder name';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Placeholder for saved payment methods query
  const { data: savedMethodsData } = useQuery({
    queryKey: ['saved-payment-methods', currentUser?.user_id],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      
      // Placeholder for actual API call
      // const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/payment-methods`, {
      //   headers: { Authorization: `Bearer ${authToken}` }
      // });
      // return response.data.payment_methods;
      
      return []; // Placeholder return
    },
    enabled: isAuthenticated,
    staleTime: 300000,
    refetchOnWindowFocus: false
  });

  // Payment validation mutation
  const validatePaymentMutation = useMutation({
    mutationFn: async (data: PaymentValidationRequest): Promise<PaymentValidationResponse> => {
      // Placeholder for actual API call
      // const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/payment/validate`, data);
      // return response.data;
      
      // Simulated validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { valid: true, card_type: detectCardType(data.card_details?.card_number || '') };
    },
    onSuccess: (data) => {
      if (data.valid) {
        setPaymentError(null);
        navigate('/checkout/review');
      } else {
        setPaymentError(data.errors?.join(', ') || 'Payment validation failed');
      }
    },
    onError: (error: any) => {
      setPaymentError(error.response?.data?.message || 'Payment validation failed');
    }
  });

  // Handle credit card input changes
  const handleCreditCardChange = (field: keyof CreditCardForm, value: string) => {
    let formattedValue = value;
    
    if (field === 'card_number') {
      formattedValue = formatCardNumber(value.replace(/\D/g, '').substr(0, 19));
      setCardType(detectCardType(formattedValue));
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substr(0, 4);
    } else if (field === 'expiry_month') {
      formattedValue = value.replace(/\D/g, '').substr(0, 2);
    } else if (field === 'expiry_year') {
      formattedValue = value.replace(/\D/g, '').substr(0, 4);
    }
    
    setCreditCardForm(prev => ({
      ...prev,
      [field]: formattedValue
    }));
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle billing address change
  const handleBillingAddressChange = (field: keyof BillingAddress, value: string) => {
    setBillingAddress(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError(null);
    
    if (paymentMethod === 'credit_card' && !validateCreditCardForm()) {
      return;
    }
    
    if (!billingAddress) {
      setPaymentError('Please provide a billing address');
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      await validatePaymentMutation.mutateAsync({
        payment_method_type: paymentMethod,
        card_details: paymentMethod === 'credit_card' ? creditCardForm : undefined,
        billing_address: billingAddress
      });
    } catch (error) {
      console.error('Payment validation error:', error);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Initialize billing address from shipping address (placeholder)
  useEffect(() => {
    if (sameAsShipping && currentUser) {
      setBillingAddress({
        user_id: currentUser.user_id,
        type: 'billing',
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        street_address_1: '123 Main St', // Placeholder - would come from shipping address
        city: 'Sample City',
        state_province: 'Sample State',
        postal_code: '12345',
        country: 'United States',
        phone: currentUser.phone,
        is_default: false
      });
    }
  }, [sameAsShipping, currentUser]);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Checkout Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-center space-x-4 sm:space-x-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  ✓
                </div>
                <span className="ml-2 text-sm font-medium text-gray-900">Shipping</span>
              </div>
              <div className="w-8 h-0.5 bg-blue-600"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <span className="ml-2 text-sm font-medium text-blue-600">Payment</span>
              </div>
              <div className="w-8 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 text-gray-500 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium text-gray-500">Review</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Payment Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Information</h2>

                {paymentError && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm">{paymentError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <label className="text-base font-medium text-gray-900">Payment Method</label>
                    <div className="mt-4 space-y-3">
                      {/* Credit Card Option */}
                      <div className="flex items-center">
                        <input
                          id="credit_card"
                          name="payment_method"
                          type="radio"
                          value="credit_card"
                          checked={paymentMethod === 'credit_card'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="credit_card" className="ml-3 block text-sm font-medium text-gray-700">
                          Credit or Debit Card
                        </label>
                        <div className="ml-auto flex space-x-2">
                          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAzMiAyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iIzAwNTFBNSIvPjx0ZXh0IHg9IjE2IiB5PSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+VklTQTwvdGV4dD48L3N2Zz4=" alt="Visa" className="w-8 h-5" />
                          <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAzMiAyMCIgZmlsbD0ibm9uZSI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjIwIiByeD0iNCIgZmlsbD0iI0VCMDAxQiIvPjx0ZXh0IHg9IjE2IiB5PSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NQVNURUM8L3RleHQ+PC9zdmc+" alt="Mastercard" className="w-8 h-5" />
                        </div>
                      </div>

                      {/* Mobile Wallets */}
                      {isMobile && (
                        <>
                          <div className="flex items-center">
                            <input
                              id="apple_pay"
                              name="payment_method"
                              type="radio"
                              value="apple_pay"
                              checked={paymentMethod === 'apple_pay'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <label htmlFor="apple_pay" className="ml-3 block text-sm font-medium text-gray-700">
                              Apple Pay
                            </label>
                            <div className="ml-auto">
                              <div className="w-12 h-6 bg-black rounded text-white text-xs flex items-center justify-center">
                                Pay
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center">
                            <input
                              id="google_pay"
                              name="payment_method"
                              type="radio"
                              value="google_pay"
                              checked={paymentMethod === 'google_pay'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                            />
                            <label htmlFor="google_pay" className="ml-3 block text-sm font-medium text-gray-700">
                              Google Pay
                            </label>
                          </div>
                        </>
                      )}

                      {/* PayPal */}
                      <div className="flex items-center">
                        <input
                          id="paypal"
                          name="payment_method"
                          type="radio"
                          value="paypal"
                          checked={paymentMethod === 'paypal'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="paypal" className="ml-3 block text-sm font-medium text-gray-700">
                          PayPal
                        </label>
                        <div className="ml-auto">
                          <div className="text-blue-600 font-bold text-sm">PayPal</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Credit Card Form */}
                  {paymentMethod === 'credit_card' && (
                    <div className="border-t pt-6">
                      <div className="grid grid-cols-1 gap-6">
                        {/* Card Number */}
                        <div>
                          <label htmlFor="card_number" className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="card_number"
                              value={creditCardForm.card_number}
                              onChange={(e) => handleCreditCardChange('card_number', e.target.value)}
                              placeholder="1234 5678 9012 3456"
                              className={`block w-full px-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.card_number ? 'border-red-300' : 'border-gray-300'}`}
                              autoComplete="cc-number"
                            />
                            {cardType && (
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                <div className="text-xs text-gray-500 uppercase">{cardType}</div>
                              </div>
                            )}
                          </div>
                          {formErrors.card_number && (
                            <p className="mt-2 text-sm text-red-600">{formErrors.card_number}</p>
                          )}
                        </div>

                        {/* Expiry and CVV */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label htmlFor="expiry_month" className="block text-sm font-medium text-gray-700 mb-2">
                              Month
                            </label>
                            <input
                              type="text"
                              id="expiry_month"
                              value={creditCardForm.expiry_month}
                              onChange={(e) => handleCreditCardChange('expiry_month', e.target.value)}
                              placeholder="MM"
                              className={`block w-full px-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.expiry ? 'border-red-300' : 'border-gray-300'}`}
                              autoComplete="cc-exp-month"
                            />
                          </div>
                          <div>
                            <label htmlFor="expiry_year" className="block text-sm font-medium text-gray-700 mb-2">
                              Year
                            </label>
                            <input
                              type="text"
                              id="expiry_year"
                              value={creditCardForm.expiry_year}
                              onChange={(e) => handleCreditCardChange('expiry_year', e.target.value)}
                              placeholder="YYYY"
                              className={`block w-full px-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.expiry ? 'border-red-300' : 'border-gray-300'}`}
                              autoComplete="cc-exp-year"
                            />
                          </div>
                          <div>
                            <label htmlFor="cvv" className="block text-sm font-medium text-gray-700 mb-2">
                              <span>CVV</span>
                              <button
                                type="button"
                                onClick={() => setShowCvvHelp(!showCvvHelp)}
                                className="ml-1 text-gray-400 hover:text-gray-600"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </label>
                            <input
                              type="text"
                              id="cvv"
                              value={creditCardForm.cvv}
                              onChange={(e) => handleCreditCardChange('cvv', e.target.value)}
                              placeholder="123"
                              className={`block w-full px-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.cvv ? 'border-red-300' : 'border-gray-300'}`}
                              autoComplete="cc-csc"
                            />
                            {formErrors.cvv && (
                              <p className="mt-2 text-sm text-red-600">{formErrors.cvv}</p>
                            )}
                          </div>
                        </div>

                        {/* CVV Help */}
                        {showCvvHelp && (
                          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                            <p className="text-sm text-blue-700">
                              The CVV is the 3-digit security code on the back of your card (4 digits on the front for American Express).
                            </p>
                          </div>
                        )}

                        {/* Cardholder Name */}
                        <div>
                          <label htmlFor="cardholder_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Cardholder Name
                          </label>
                          <input
                            type="text"
                            id="cardholder_name"
                            value={creditCardForm.cardholder_name}
                            onChange={(e) => handleCreditCardChange('cardholder_name', e.target.value)}
                            placeholder="John Doe"
                            className={`block w-full px-3 py-3 border rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.cardholder_name ? 'border-red-300' : 'border-gray-300'}`}
                            autoComplete="cc-name"
                          />
                          {formErrors.cardholder_name && (
                            <p className="mt-2 text-sm text-red-600">{formErrors.cardholder_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Billing Address */}
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h3>
                    
                    <div className="flex items-center mb-4">
                      <input
                        id="same_as_shipping"
                        name="same_as_shipping"
                        type="checkbox"
                        checked={sameAsShipping}
                        onChange={(e) => setSameAsShipping(e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="same_as_shipping" className="ml-2 block text-sm text-gray-900">
                        Same as shipping address
                      </label>
                    </div>

                    {!sameAsShipping && billingAddress && (
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        <div>
                          <label htmlFor="billing_first_name" className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="billing_first_name"
                            value={billingAddress.first_name}
                            onChange={(e) => handleBillingAddressChange('first_name', e.target.value)}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="billing_last_name" className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="billing_last_name"
                            value={billingAddress.last_name}
                            onChange={(e) => handleBillingAddressChange('last_name', e.target.value)}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label htmlFor="billing_street" className="block text-sm font-medium text-gray-700 mb-2">
                            Street Address
                          </label>
                          <input
                            type="text"
                            id="billing_street"
                            value={billingAddress.street_address_1}
                            onChange={(e) => handleBillingAddressChange('street_address_1', e.target.value)}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="billing_city" className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            id="billing_city"
                            value={billingAddress.city}
                            onChange={(e) => handleBillingAddressChange('city', e.target.value)}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label htmlFor="billing_postal" className="block text-sm font-medium text-gray-700 mb-2">
                            Postal Code
                          </label>
                          <input
                            type="text"
                            id="billing_postal"
                            value={billingAddress.postal_code}
                            onChange={(e) => handleBillingAddressChange('postal_code', e.target.value)}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="border-t pt-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
                      <Link
                        to="/checkout/shipping"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Shipping
                      </Link>
                      
                      <button
                        type="submit"
                        disabled={processingPayment}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingPayment ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing...
                          </>
                        ) : (
                          <>
                            Continue to Review
                            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
                
                <div className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.cart_item_id} className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                        {item.product?.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.product?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity}
                        </p>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        ${((item.product?.sale_price || item.product?.price || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="border-t mt-6 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">Free</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">$0.00</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-base font-medium">
                      <span className="text-gray-900">Total</span>
                      <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Security Badges */}
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center justify-center space-x-4">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-600">SSL Secured</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-gray-600">PCI Compliant</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_CheckoutPayment;