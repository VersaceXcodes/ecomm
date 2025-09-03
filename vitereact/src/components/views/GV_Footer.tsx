import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';

// Newsletter subscription interface
interface NewsletterSubscriptionRequest {
  email: string;
}

interface NewsletterSubscriptionResponse {
  message: string;
  subscription: {
    subscription_id: string;
    email: string;
    is_active: boolean;
    subscribed_at: string;
  };
}

const GV_Footer: React.FC = () => {
  // Newsletter form state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterError, setNewsletterError] = useState<string | null>(null);
  
  // Mobile accordion states
  const [mobileAccordionOpen, setMobileAccordionOpen] = useState({
    contact: false,
    links: false,
    social: false
  });

  // Business information (could be moved to global config)
  const businessInfo = {
    phone: '+1 (555) 123-4567',
    email: 'hello@perfumeshop.com',
    address: '123 Fragrance Avenue, Scent City, SC 12345',
    hours: 'Mon-Fri: 9AM-6PM EST, Sat-Sun: 10AM-4PM EST'
  };

  // Social media links
  const socialLinks = {
    facebook: 'https://facebook.com/perfumeshop',
    instagram: 'https://instagram.com/perfumeshop',
    twitter: 'https://twitter.com/perfumeshop'
  };

  // Newsletter subscription mutation
  const newsletterMutation = useMutation({
    mutationFn: async (data: NewsletterSubscriptionRequest): Promise<NewsletterSubscriptionResponse> => {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'}/api/newsletter/subscribe`,
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
      setNewsletterSuccess(true);
      setNewsletterError(null);
      setNewsletterEmail('');
      
      // Auto-hide success message after 5 seconds
      setTimeout(() => {
        setNewsletterSuccess(false);
      }, 5000);
    },
    onError: (error: any) => {
      setNewsletterSuccess(false);
      if (error.response?.data?.message) {
        setNewsletterError(error.response.data.message);
      } else if (error.response?.status === 409) {
        setNewsletterError('This email is already subscribed to our newsletter.');
      } else {
        setNewsletterError('Failed to subscribe. Please try again later.');
      }
    },
  });

  // Handle newsletter form submission
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewsletterError(null);
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newsletterEmail)) {
      setNewsletterError('Please enter a valid email address.');
      return;
    }

    await newsletterMutation.mutateAsync({ email: newsletterEmail });
  };

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewsletterEmail(e.target.value);
    // Clear error when user starts typing
    if (newsletterError) {
      setNewsletterError(null);
    }
  };

  // Toggle mobile accordion sections
  const toggleAccordion = (section: keyof typeof mobileAccordionOpen) => {
    setMobileAccordionOpen(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <>
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Desktop Layout */}
          <div className="hidden md:grid md:grid-cols-4 md:gap-8">
            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Contact Us</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p className="flex items-start">
                  <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                    </svg>
                  </span>
                  {businessInfo.phone}
                </p>
                <p className="flex items-start">
                  <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                    </svg>
                  </span>
                  {businessInfo.email}
                </p>
                <p className="flex items-start">
                  <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                    </svg>
                  </span>
                  {businessInfo.address}
                </p>
                <p className="flex items-start">
                  <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                    <svg fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                  </span>
                  {businessInfo.hours}
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors duration-200">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors duration-200">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="hover:text-white transition-colors duration-200">
                    All Products
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Shipping Information
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Return Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-200">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Cookie Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Refund Policy
                  </a>
                </li>
              </ul>
            </div>

            {/* Newsletter Signup */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">Stay Connected</h3>
              <p className="text-sm text-gray-300">
                Subscribe to our newsletter for exclusive offers and fragrance tips.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div>
                  <label htmlFor="newsletter-email-desktop" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email-desktop"
                    type="email"
                    value={newsletterEmail}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={newsletterMutation.isPending || newsletterSuccess}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {newsletterMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    </span>
                  ) : newsletterSuccess ? (
                    'Subscribed!'
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>

              {/* Newsletter feedback */}
              {newsletterSuccess && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                  <p>Thank you for subscribing! Check your email for confirmation.</p>
                </div>
              )}
              
              {newsletterError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                  <p>{newsletterError}</p>
                </div>
              )}

              {/* Social Media Links */}
              <div className="pt-4">
                <p className="text-sm text-gray-300 mb-3">Follow us:</p>
                <div className="flex space-x-4">
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Follow us on Facebook"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Follow us on Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.345-1.048-2.345-2.345s1.048-2.345 2.345-2.345s2.345 1.048 2.345 2.345s-1.048 2.345-2.345 2.345zm7.138 0c-1.297 0-2.345-1.048-2.345-2.345s1.048-2.345 2.345-2.345s2.345 1.048 2.345 2.345s-1.048 2.345-2.345 2.345z"/>
                    </svg>
                  </a>
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Follow us on Twitter"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Layout */}
          <div className="md:hidden space-y-4">
            {/* Contact Information Accordion */}
            <div className="border-b border-gray-700 pb-4">
              <button
                onClick={() => toggleAccordion('contact')}
                className="flex items-center justify-between w-full text-left"
                aria-expanded={mobileAccordionOpen.contact}
              >
                <h3 className="text-lg font-semibold text-white">Contact Us</h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                    mobileAccordionOpen.contact ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {mobileAccordionOpen.contact && (
                <div className="mt-4 space-y-3 text-sm text-gray-300">
                  <p className="flex items-start">
                    <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                      </svg>
                    </span>
                    {businessInfo.phone}
                  </p>
                  <p className="flex items-start">
                    <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                      </svg>
                    </span>
                    {businessInfo.email}
                  </p>
                  <p className="flex items-start">
                    <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                      </svg>
                    </span>
                    {businessInfo.address}
                  </p>
                  <p className="flex items-start">
                    <span className="inline-block w-5 h-5 mr-2 mt-0.5">
                      <svg fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                      </svg>
                    </span>
                    {businessInfo.hours}
                  </p>
                </div>
              )}
            </div>

            {/* Links Accordion */}
            <div className="border-b border-gray-700 pb-4">
              <button
                onClick={() => toggleAccordion('links')}
                className="flex items-center justify-between w-full text-left"
                aria-expanded={mobileAccordionOpen.links}
              >
                <h3 className="text-lg font-semibold text-white">Links</h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${
                    mobileAccordionOpen.links ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {mobileAccordionOpen.links && (
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-300">
                  <Link to="/about" className="hover:text-white transition-colors duration-200">
                    About Us
                  </Link>
                  <Link to="/contact" className="hover:text-white transition-colors duration-200">
                    Contact
                  </Link>
                  <Link to="/products" className="hover:text-white transition-colors duration-200">
                    All Products
                  </Link>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Shipping Info
                  </a>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Return Policy
                  </a>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    FAQ
                  </a>
                  <Link to="/privacy" className="hover:text-white transition-colors duration-200">
                    Privacy Policy
                  </Link>
                  <a href="#" className="hover:text-white transition-colors duration-200">
                    Terms of Service
                  </a>
                </div>
              )}
            </div>

            {/* Newsletter & Social */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Stay Connected</h3>
              <p className="text-sm text-gray-300 mb-4">
                Subscribe to our newsletter for exclusive offers and fragrance tips.
              </p>
              
              <form onSubmit={handleNewsletterSubmit} className="space-y-3 mb-6">
                <div>
                  <label htmlFor="newsletter-email-mobile" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email-mobile"
                    type="email"
                    value={newsletterEmail}
                    onChange={handleEmailChange}
                    placeholder="Enter your email"
                    className="w-full px-3 py-3 text-gray-900 placeholder-gray-500 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={newsletterMutation.isPending || newsletterSuccess}
                  className="w-full px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {newsletterMutation.isPending ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Subscribing...
                    </span>
                  ) : newsletterSuccess ? (
                    'Subscribed!'
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </form>

              {/* Newsletter feedback */}
              {newsletterSuccess && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm mb-4">
                  <p>Thank you for subscribing! Check your email for confirmation.</p>
                </div>
              )}
              
              {newsletterError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm mb-4">
                  <p>{newsletterError}</p>
                </div>
              )}

              {/* Social Media Links */}
              <div>
                <p className="text-sm text-gray-300 mb-3">Follow us:</p>
                <div className="flex space-x-6">
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Follow us on Facebook"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Follow us on Instagram"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.345-1.048-2.345-2.345s1.048-2.345 2.345-2.345s2.345 1.048 2.345 2.345s-1.048 2.345-2.345 2.345zm7.138 0c-1.297 0-2.345-1.048-2.345-2.345s1.048-2.345 2.345-2.345s2.345 1.048 2.345 2.345s-1.048 2.345-2.345 2.345z"/>
                    </svg>
                  </a>
                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                    aria-label="Follow us on Twitter"
                  >
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright Section */}
          <div className="mt-12 pt-8 border-t border-gray-700">
            <div className="text-center text-sm text-gray-400">
              <p>&copy; {new Date().getFullYear()} PerfumeShop. All rights reserved.</p>
              <p className="mt-2">
                Crafting exceptional fragrances for discerning customers worldwide.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;