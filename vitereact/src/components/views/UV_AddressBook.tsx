import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/main';
import axios from 'axios';

// TypeScript interfaces
interface Address {
  address_id: string;
  user_id: string;
  type: string;
  first_name: string;
  last_name: string;
  street_address_1: string;
  street_address_2: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface AddressFormData {
  type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  street_address_1: string;
  street_address_2: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone: string;
  is_default: boolean;
}

interface CreateAddressRequest {
  type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  street_address_1: string;
  street_address_2?: string | null;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
  phone?: string | null;
  is_default?: boolean;
}

interface AddressesResponse {
  addresses: Address[];
}

// Default form state
const defaultFormState: AddressFormData = {
  type: 'shipping',
  first_name: '',
  last_name: '',
  street_address_1: '',
  street_address_2: '',
  city: '',
  state_province: '',
  postal_code: '',
  country: '',
  phone: '',
  is_default: false
};

const UV_AddressBook: React.FC = () => {
  // Zustand state - individual selectors to avoid infinite loops
  const authToken = useAppStore(state => state.authentication_state.auth_token);
  const currentUser = useAppStore(state => state.authentication_state.current_user);

  // Local state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormData>(defaultFormState);
  const [addressValidationError, setAddressValidationError] = useState<string | null>(null);
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  const queryClient = useQueryClient();

  // API Functions
  const fetchAddresses = async (): Promise<AddressesResponse> => {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/addresses`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  };

  const createAddress = async (addressData: CreateAddressRequest): Promise<Address> => {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/addresses`,
      addressData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  };

  const updateAddress = async ({ addressId, addressData }: { addressId: string; addressData: CreateAddressRequest }): Promise<Address> => {
    const response = await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/addresses/${addressId}`,
      addressData,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  };

  const deleteAddress = async (addressId: string): Promise<void> => {
    await axios.delete(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/addresses/${addressId}`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
  };

  const setDefaultAddress = async (addressId: string): Promise<Address> => {
    const response = await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/user/addresses/${addressId}/set-default`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );
    return response.data;
  };

  // React Query hooks
  const {
    data: addressesData,
    isLoading: loadingAddresses,
    error: addressesError,
  } = useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
    enabled: !!authToken,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const createAddressMutation = useMutation({
    mutationFn: createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setAddressForm(defaultFormState);
      setShowAddressForm(false);
      setAddressValidationError(null);
    },
    onError: (error: any) => {
      setAddressValidationError(error.response?.data?.message || 'Failed to create address');
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setEditingAddressId(null);
      setAddressForm(defaultFormState);
      setShowAddressForm(false);
      setAddressValidationError(null);
    },
    onError: (error: any) => {
      setAddressValidationError(error.response?.data?.message || 'Failed to update address');
    },
  });

  const deleteAddressMutation = useMutation({
    mutationFn: deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setDeletingAddressId(null);
    },
    onError: (error: any) => {
      console.error('Failed to delete address:', error);
    },
  });

  const setDefaultMutation = useMutation({
    mutationFn: setDefaultAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (error: any) => {
      console.error('Failed to set default address:', error);
    },
  });

  // Event handlers
  const handleAddNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm(defaultFormState);
    setShowAddressForm(true);
    setAddressValidationError(null);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.address_id);
    setAddressForm({
      type: address.type as 'shipping' | 'billing',
      first_name: address.first_name,
      last_name: address.last_name,
      street_address_1: address.street_address_1,
      street_address_2: address.street_address_2 || '',
      city: address.city,
      state_province: address.state_province,
      postal_code: address.postal_code,
      country: address.country,
      phone: address.phone || '',
      is_default: address.is_default,
    });
    setShowAddressForm(true);
    setAddressValidationError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressValidationError(null);

    // Basic validation
    if (!addressForm.first_name.trim() || !addressForm.last_name.trim() || 
        !addressForm.street_address_1.trim() || !addressForm.city.trim() ||
        !addressForm.state_province.trim() || !addressForm.postal_code.trim() ||
        !addressForm.country.trim()) {
      setAddressValidationError('Please fill in all required fields');
      return;
    }

    const addressData: CreateAddressRequest = {
      type: addressForm.type,
      first_name: addressForm.first_name.trim(),
      last_name: addressForm.last_name.trim(),
      street_address_1: addressForm.street_address_1.trim(),
      street_address_2: addressForm.street_address_2.trim() || null,
      city: addressForm.city.trim(),
      state_province: addressForm.state_province.trim(),
      postal_code: addressForm.postal_code.trim(),
      country: addressForm.country.trim(),
      phone: addressForm.phone.trim() || null,
      is_default: addressForm.is_default,
    };

    if (editingAddressId) {
      updateAddressMutation.mutate({ addressId: editingAddressId, addressData });
    } else {
      createAddressMutation.mutate(addressData);
    }
  };

  const handleDeleteAddress = (addressId: string) => {
    if (confirm('Are you sure you want to delete this address?')) {
      setDeletingAddressId(addressId);
      deleteAddressMutation.mutate(addressId);
    }
  };

  const handleSetDefault = (addressId: string) => {
    setDefaultMutation.mutate(addressId);
  };

  const handleCancelForm = () => {
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm(defaultFormState);
    setAddressValidationError(null);
  };

  const addresses = addressesData?.addresses || [];
  const defaultAddress = addresses.find(addr => addr.is_default);
  const savingAddress = createAddressMutation.isPending || updateAddressMutation.isPending;

  return (
    <>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Address Book</h1>
                  <p className="mt-1 text-sm text-gray-600">
                    Manage your shipping and billing addresses
                  </p>
                </div>
                <button
                  onClick={handleAddNewAddress}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Add New Address
                </button>
              </div>
            </div>

            {/* Default Address Summary */}
            {defaultAddress && (
              <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-900">Default Shipping Address</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      {defaultAddress.first_name} {defaultAddress.last_name}, {defaultAddress.street_address_1}, {defaultAddress.city}, {defaultAddress.state_province} {defaultAddress.postal_code}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Address Form */}
          {showAddressForm && (
            <div className="bg-white shadow rounded-lg mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">
                  {editingAddressId ? 'Edit Address' : 'Add New Address'}
                </h2>
              </div>
              
              <form onSubmit={handleFormSubmit} className="px-6 py-4 space-y-6">
                {addressValidationError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p className="text-sm" aria-live="polite">{addressValidationError}</p>
                  </div>
                )}

                {/* Address Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address Type
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="shipping"
                        checked={addressForm.type === 'shipping'}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, type: e.target.value as 'shipping' | 'billing' }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Shipping</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="billing"
                        checked={addressForm.type === 'billing'}
                        onChange={(e) => setAddressForm(prev => ({ ...prev, type: e.target.value as 'shipping' | 'billing' }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700">Billing</span>
                    </label>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      id="first_name"
                      value={addressForm.first_name}
                      onChange={(e) => {
                        setAddressValidationError(null);
                        setAddressForm(prev => ({ ...prev, first_name: e.target.value }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      aria-describedby="first_name_error"
                    />
                  </div>
                  <div>
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      id="last_name"
                      value={addressForm.last_name}
                      onChange={(e) => {
                        setAddressValidationError(null);
                        setAddressForm(prev => ({ ...prev, last_name: e.target.value }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Address Fields */}
                <div>
                  <label htmlFor="street_address_1" className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    id="street_address_1"
                    value={addressForm.street_address_1}
                    onChange={(e) => {
                      setAddressValidationError(null);
                      setAddressForm(prev => ({ ...prev, street_address_1: e.target.value }));
                    }}
                    required
                    placeholder="123 Main Street"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="street_address_2" className="block text-sm font-medium text-gray-700 mb-1">
                    Apartment, suite, etc. (optional)
                  </label>
                  <input
                    type="text"
                    id="street_address_2"
                    value={addressForm.street_address_2}
                    onChange={(e) => setAddressForm(prev => ({ ...prev, street_address_2: e.target.value }))}
                    placeholder="Apt 4B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* City, State, Postal */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      id="city"
                      value={addressForm.city}
                      onChange={(e) => {
                        setAddressValidationError(null);
                        setAddressForm(prev => ({ ...prev, city: e.target.value }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="state_province" className="block text-sm font-medium text-gray-700 mb-1">
                      State/Province *
                    </label>
                    <input
                      type="text"
                      id="state_province"
                      value={addressForm.state_province}
                      onChange={(e) => {
                        setAddressValidationError(null);
                        setAddressForm(prev => ({ ...prev, state_province: e.target.value }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="postal_code" className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code *
                    </label>
                    <input
                      type="text"
                      id="postal_code"
                      value={addressForm.postal_code}
                      onChange={(e) => {
                        setAddressValidationError(null);
                        setAddressForm(prev => ({ ...prev, postal_code: e.target.value }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Country and Phone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
                      Country *
                    </label>
                    <input
                      type="text"
                      id="country"
                      value={addressForm.country}
                      onChange={(e) => {
                        setAddressValidationError(null);
                        setAddressForm(prev => ({ ...prev, country: e.target.value }));
                      }}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (optional)
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>

                {/* Default Address Checkbox */}
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={(e) => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Set as default {addressForm.type} address</span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelForm}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {savingAddress ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {editingAddressId ? 'Updating...' : 'Creating...'}
                      </span>
                    ) : (
                      editingAddressId ? 'Update Address' : 'Create Address'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Address List */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Saved Addresses</h2>
            </div>

            {loadingAddresses ? (
              <div className="px-6 py-8 text-center">
                <div className="inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-gray-500">Loading addresses...</span>
                </div>
              </div>
            ) : addressesError ? (
              <div className="px-6 py-8 text-center">
                <div className="text-red-600">
                  <p>Failed to load addresses. Please try again.</p>
                </div>
              </div>
            ) : addresses.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <div className="text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-lg font-medium mb-2">No addresses saved</p>
                  <p className="text-sm">Add your first address to get started with faster checkout.</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {addresses.map((address) => (
                  <div key={address.address_id} className="px-6 py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h3 className="text-sm font-medium text-gray-900">
                            {address.first_name} {address.last_name}
                          </h3>
                          <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            address.type === 'shipping' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {address.type}
                          </span>
                          {address.is_default && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>{address.street_address_1}</p>
                          {address.street_address_2 && <p>{address.street_address_2}</p>}
                          <p>{address.city}, {address.state_province} {address.postal_code}</p>
                          <p>{address.country}</p>
                          {address.phone && <p>Phone: {address.phone}</p>}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        {!address.is_default && (
                          <button
                            onClick={() => handleSetDefault(address.address_id)}
                            disabled={setDefaultMutation.isPending}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50 transition-colors"
                            title="Set as default"
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          onClick={() => handleEditAddress(address)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
                          aria-label={`Edit address for ${address.first_name} ${address.last_name}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAddress(address.address_id)}
                          disabled={deletingAddressId === address.address_id}
                          className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50 transition-colors"
                          aria-label={`Delete address for ${address.first_name} ${address.last_name}`}
                        >
                          {deletingAddressId === address.address_id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default UV_AddressBook;