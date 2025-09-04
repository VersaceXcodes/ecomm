import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAppStore } from '@/store/main';

// Types based on Zod schemas
interface Address {
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

interface ShippingMethod {
  shipping_method_id: string;
  name: string;
  description?: string;
  cost: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  display_order: number;
}

interface CreateAddressPayload {
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

const UV_CheckoutShipping: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Global state access with individual selectors
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const cartTotal = useAppStore(state => state.cart_state.subtotal);

  // Local state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(!isAuthenticated);
  const [addressSameAsShipping, setAddressSameAsShipping] = useState(true);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // New address form state
  const [newAddress, setNewAddress] = useState<CreateAddressPayload>({
    type: 'shipping',
    first_name: '',
    last_name: '',
    street_address_1: '',
    street_address_2: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States',
    phone: '',
    is_default: false
  });

  // API Base URL
  const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api`;

  // Fetch user addresses (authenticated users only)
  const {
    data: addressesData,
    isLoading: addressesLoading,
    error: _addressesError
  } = useQuery({
    queryKey: ['user-addresses', 'shipping'],
    queryFn: async () => {
      if (!isAuthenticated || !authToken) return { addresses: [] };
      
      const response = await axios.get(`${API_BASE_URL}/user/addresses`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          type: 'shipping'
        }
      });
      return response.data;
    },
    enabled: isAuthenticated && !!authToken,
    staleTime: 5 * 60 * 1000,
    retry: 1
  });

  // Fetch shipping methods
  const {
    data: shippingMethodsData,
    isLoading: shippingMethodsLoading,
    error: shippingMethodsError
  } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/shipping-methods`, {
        params: {
          is_active: true
        }
      });
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1
  });

  // Create new address mutation
  const createAddressMutation = useMutation({
    mutationFn: async (addressData: CreateAddressPayload) => {
      if (!authToken) throw new Error('Authentication required');
      
      const response = await axios.post(`${API_BASE_URL}/user/addresses`, addressData, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      setSelectedAddressId(data.address_id);
      setShowNewAddressForm(false);
      setFormErrors({});
    },
    onError: (error: any) => {
      console.error('Error creating address:', error);
      if (error.response?.data?.details) {
        setFormErrors(error.response.data.details);
      }
    }
  });

  // Set default selections on data load
  useEffect(() => {
    if (addressesData?.addresses?.length > 0 && !selectedAddressId) {
      const defaultAddress = addressesData.addresses.find((addr: Address) => addr.is_default);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.address_id!);
      } else {
        setSelectedAddressId(addressesData.addresses[0].address_id!);
      }
    }
  }, [addressesData, selectedAddressId]);

  useEffect(() => {
    if (shippingMethodsData?.shipping_methods?.length > 0 && !selectedShippingMethodId) {
      const sortedMethods = [...shippingMethodsData.shipping_methods].sort((a, b) => a.display_order - b.display_order);
      setSelectedShippingMethodId(sortedMethods[0].shipping_method_id);
    }
  }, [shippingMethodsData, selectedShippingMethodId]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!isAuthenticated || showNewAddressForm) {
      if (!newAddress.first_name.trim()) errors.first_name = 'First name is required';
      if (!newAddress.last_name.trim()) errors.last_name = 'Last name is required';
      if (!newAddress.street_address_1.trim()) errors.street_address_1 = 'Street address is required';
      if (!newAddress.city.trim()) errors.city = 'City is required';
      if (!newAddress.state_province.trim()) errors.state_province = 'State/Province is required';
      if (!newAddress.postal_code.trim()) errors.postal_code = 'Postal code is required';
      if (!newAddress.country.trim()) errors.country = 'Country is required';
    }

    if (!selectedShippingMethodId) {
      errors.shipping_method = 'Please select a shipping method';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleContinue = async () => {
    if (!validateForm()) return;

    try {
      // If user is authenticated and using new address form, create the address first
      if (isAuthenticated && showNewAddressForm) {
        await createAddressMutation.mutateAsync(newAddress);
      }

      // Navigate to payment step
      navigate('/checkout/payment');
    } catch (error) {
      console.error('Error proceeding to payment:', error);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof CreateAddressPayload, value: string | boolean) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const addresses = addressesData?.addresses || [];
  const shippingMethods = shippingMethodsData?.shipping_methods || [];
  const selectedShippingMethod = shippingMethods.find(method => method.shipping_method_id === selectedShippingMethodId);

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex items-center text-blue-600">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-full text-sm font-medium">
                    1
                  </div>
                  <span className="ml-2 text-sm font-medium">Shipping</span>
                </div>
                <div className="mx-4 h-0.5 w-16 bg-gray-300"></div>
              </div>
              <div className="flex items-center">
                <div className="flex items-center text-gray-400">
                  <div className="flex items-center justify-center w-8 h-8 border-2 border-gray-300 rounded-full text-sm font-medium">
                    2
                  </div>
                  <span className="ml-2 text-sm font-medium">Payment</span>
                </div>
                <div className="mx-4 h-0.5 w-16 bg-gray-300"></div>
              </div>
              <div className="flex items-center text-gray-400">
                <div className="flex items-center justify-center w-8 h-8 border-2 border-gray-300 rounded-full text-sm font-medium">
                  3
                </div>
                <span className="ml-2 text-sm font-medium">Review</span>
              </div>
            </div>
          </div>

          <div className="bg-white shadow-sm rounded-lg">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">Shipping Information</h1>
              <p className="mt-1 text-sm text-gray-600">
                Choose your shipping address and delivery method
              </p>
            </div>

            <div className="px-6 py-6 space-y-8">
              {/* Shipping Address Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Shipping Address</h2>
                
                {/* Authenticated user - saved addresses */}
                {isAuthenticated && addresses.length > 0 && !showNewAddressForm && (
                  <div className="space-y-4">
                    {addresses.map((address: Address) => (
                      <div
                        key={address.address_id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedAddressId === address.address_id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedAddressId(address.address_id!)}
                      >
                        <div className="flex items-start">
                          <input
                            type="radio"
                            checked={selectedAddressId === address.address_id}
                            onChange={() => setSelectedAddressId(address.address_id!)}
                            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <div className="ml-3 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {address.first_name} {address.last_name}
                              </p>
                              {address.is_default && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {address.street_address_1}
                              {address.street_address_2 && `, ${address.street_address_2}`}
                            </p>
                            <p className="text-sm text-gray-600">
                              {address.city}, {address.state_province} {address.postal_code}
                            </p>
                            <p className="text-sm text-gray-600">{address.country}</p>
                            {address.phone && (
                              <p className="text-sm text-gray-600">{address.phone}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <button
                      onClick={() => setShowNewAddressForm(true)}
                      className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add New Address
                    </button>
                  </div>
                )}

                {/* New address form */}
                {(!isAuthenticated || showNewAddressForm) && (
                  <div className="space-y-4">
                    {isAuthenticated && (
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-medium text-gray-900">Add New Address</h3>
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium text-gray-700">
                          First Name *
                        </label>
                        <input
                          type="text"
                          id="first_name"
                          value={newAddress.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.first_name ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.first_name && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.first_name}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium text-gray-700">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          id="last_name"
                          value={newAddress.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.last_name ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.last_name && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.last_name}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="street_address_1" className="block text-sm font-medium text-gray-700">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        id="street_address_1"
                        value={newAddress.street_address_1}
                        onChange={(e) => handleInputChange('street_address_1', e.target.value)}
                        className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                          formErrors.street_address_1 ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {formErrors.street_address_1 && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.street_address_1}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="street_address_2" className="block text-sm font-medium text-gray-700">
                        Apartment, Suite, etc. (Optional)
                      </label>
                      <input
                        type="text"
                        id="street_address_2"
                        value={newAddress.street_address_2}
                        onChange={(e) => handleInputChange('street_address_2', e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <div>
                        <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                          City *
                        </label>
                        <input
                          type="text"
                          id="city"
                          value={newAddress.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.city ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.city && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.city}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="state_province" className="block text-sm font-medium text-gray-700">
                          State/Province *
                        </label>
                        <input
                          type="text"
                          id="state_province"
                          value={newAddress.state_province}
                          onChange={(e) => handleInputChange('state_province', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.state_province ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.state_province && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.state_province}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700">
                          Postal Code *
                        </label>
                        <input
                          type="text"
                          id="postal_code"
                          value={newAddress.postal_code}
                          onChange={(e) => handleInputChange('postal_code', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.postal_code ? 'border-red-300' : 'border-gray-300'
                          }`}
                        />
                        {formErrors.postal_code && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.postal_code}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                          Country *
                        </label>
                        <select
                          id="country"
                          value={newAddress.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
                            formErrors.country ? 'border-red-300' : 'border-gray-300'
                          }`}
                        >
                          <option value="United States">United States</option>
                          <option value="Canada">Canada</option>
                          <option value="United Kingdom">United Kingdom</option>
                          <option value="Australia">Australia</option>
                        </select>
                        {formErrors.country && (
                          <p className="mt-1 text-sm text-red-600">{formErrors.country}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          value={newAddress.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    {isAuthenticated && (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_default"
                          checked={newAddress.is_default}
                          onChange={(e) => handleInputChange('is_default', e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
                          Set as default shipping address
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {addressesLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading addresses...</span>
                  </div>
                )}
              </div>

              {/* Billing Address Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Billing Address</h2>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="same_as_shipping"
                    checked={addressSameAsShipping}
                    onChange={(e) => setAddressSameAsShipping(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="same_as_shipping" className="ml-2 block text-sm text-gray-700">
                    Same as shipping address
                  </label>
                </div>
              </div>

              {/* Shipping Methods Section */}
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Delivery Method</h2>
                
                {shippingMethodsLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading shipping methods...</span>
                  </div>
                )}

                {shippingMethodsError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p className="text-sm">Error loading shipping methods. Please try again.</p>
                  </div>
                )}

                <div className="space-y-4">
                  {shippingMethods.map((method: ShippingMethod) => (
                    <div
                      key={method.shipping_method_id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedShippingMethodId === method.shipping_method_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedShippingMethodId(method.shipping_method_id)}
                    >
                      <div className="flex items-start">
                        <input
                          type="radio"
                          checked={selectedShippingMethodId === method.shipping_method_id}
                          onChange={() => setSelectedShippingMethodId(method.shipping_method_id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <div className="ml-3 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-900">{method.name}</p>
                            <p className="text-sm font-medium text-gray-900">
                              {method.cost === 0 ? 'Free' : `$${method.cost.toFixed(2)}`}
                            </p>
                          </div>
                          {method.description && (
                            <p className="text-sm text-gray-600 mt-1">{method.description}</p>
                          )}
                          <p className="text-sm text-gray-600 mt-1">
                            Estimated delivery: {method.estimated_days_min === method.estimated_days_max 
                              ? `${method.estimated_days_min} business day${method.estimated_days_min > 1 ? 's' : ''}`
                              : `${method.estimated_days_min}-${method.estimated_days_max} business days`
                            }
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {formErrors.shipping_method && (
                  <p className="mt-2 text-sm text-red-600">{formErrors.shipping_method}</p>
                )}
              </div>

              {/* Order Summary */}
              {selectedShippingMethod && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-base font-medium text-gray-900 mb-2">Order Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="text-gray-900">${cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="text-gray-900">
                        {selectedShippingMethod.cost === 0 ? 'Free' : `$${selectedShippingMethod.cost.toFixed(2)}`}
                      </span>
                    </div>
                    <div className="border-t pt-1 mt-2">
                      <div className="flex justify-between font-medium">
                        <span className="text-gray-900">Total</span>
                        <span className="text-gray-900">
                          ${(cartTotal + selectedShippingMethod.cost).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation buttons */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
              <Link
                to="/cart"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Cart
              </Link>
              
              <button
                onClick={handleContinue}
                disabled={createAddressMutation.isPending}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createAddressMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Payment
                    <svg className="h-4 w-4 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_CheckoutShipping;