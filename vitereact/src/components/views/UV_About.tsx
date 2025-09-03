import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Static data structure that would typically come from CMS/API
const COMPANY_INFO = {
  name: "PerfumeShop",
  description: "Premium fragrance destination offering curated selection of luxury perfumes",
  founded_year: 2018,
  mission: "To make luxury fragrances accessible to everyone while maintaining the highest standards of authenticity and quality.",
  values: [
    "Authenticity - Every product is guaranteed genuine",
    "Quality - Premium standards in every aspect",
    "Customer Focus - Your satisfaction is our priority", 
    "Expertise - Guided by fragrance professionals",
    "Sustainability - Committed to responsible practices"
  ]
};

const TEAM_MEMBERS = [
  {
    name: "Isabella Martinez",
    position: "Master Perfumer & Founder", 
    bio: "With over 15 years in luxury fragrance development, Isabella brings expertise from leading fragrance houses in Paris and Grasse.",
    image_url: "https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
    expertise: ["Fragrance Development", "Quality Assurance", "Luxury Brand Management"]
  },
  {
    name: "James Chen",
    position: "Head of Customer Experience",
    bio: "James ensures every customer receives expert guidance in selecting their perfect fragrance through personalized consultation.",
    image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
    expertise: ["Customer Service", "Fragrance Consulting", "Product Knowledge"]
  },
  {
    name: "Sophie Laurent",
    position: "Sourcing & Authentication Specialist", 
    bio: "Sophie oversees our global sourcing network and authentication processes, ensuring every product meets our authenticity standards.",
    image_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=400&q=80",
    expertise: ["Product Sourcing", "Authentication", "Supply Chain Management"]
  }
];

const TESTIMONIALS = [
  {
    customer_name: "Rachel Thompson",
    rating: 5,
    comment: "Exceptional service and authentic products. The fragrance consultation helped me find my signature scent!",
    verified: true
  },
  {
    customer_name: "Michael Rodriguez", 
    rating: 5,
    comment: "Fast shipping, perfect packaging, and the perfume is exactly as described. Highly recommend!",
    verified: true
  },
  {
    customer_name: "Emily Johnson",
    rating: 5,
    comment: "Love the personalized approach and expert recommendations. My new favorite perfume destination.",
    verified: true
  }
];

const BUSINESS_CREDENTIALS = [
  {
    type: "Certification",
    name: "Authorized Retailer",
    description: "Official authorized retailer for all luxury fragrance brands",
    image_url: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    type: "Recognition", 
    name: "Excellence in Customer Service",
    description: "Awarded for outstanding customer satisfaction and service quality",
    image_url: "https://images.unsplash.com/photo-1567427017947-545c5f8d16ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  },
  {
    type: "Certification",
    name: "Authenticity Guarantee",
    description: "100% authentic products with comprehensive authentication process",
    image_url: "https://images.unsplash.com/photo-1551836022-deb4988cc6c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
  }
];

const UV_About: React.FC = () => {
  const [loading_content, setLoadingContent] = useState(true);

  useEffect(() => {
    // Simulate content loading
    const timer = setTimeout(() => {
      setLoadingContent(false);
    }, 800);

    return () => clearTimeout(timer);
  }, []);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <svg
        key={index}
        className={`w-4 h-4 ${index < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  if (loading_content) {
    return (
      <>
        <div className="min-h-screen bg-gray-50 animate-pulse">
          <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="space-y-8">
              <div className="h-12 bg-gray-200 rounded w-1/2 mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-md">
                    <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-gray-900 to-gray-700 text-white py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Our Story
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              {COMPANY_INFO.description}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/products"
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Shop Our Collection
              </Link>
              <Link
                to="/contact"
                className="border-2 border-white hover:bg-white hover:text-gray-900 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </section>

        {/* Company Information */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Since {COMPANY_INFO.founded_year}
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  {COMPANY_INFO.mission}
                </p>
                <p className="text-gray-600 mb-8 leading-relaxed">
                  What started as a passion for luxury fragrances has grown into a trusted destination 
                  for perfume enthusiasts worldwide. We believe that the right fragrance has the power 
                  to transform your day and express your unique personality.
                </p>
                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Our Commitment</h3>
                  <p className="text-blue-800">
                    Every product in our collection is carefully selected and authenticated to ensure 
                    you receive only genuine, high-quality fragrances.
                  </p>
                </div>
              </div>
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1541643600914-78b084683601?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
                  alt="Luxury perfume collection"
                  className="rounded-lg shadow-xl w-full h-96 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Our Values
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                The principles that guide everything we do
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {COMPANY_INFO.values.map((value, index) => {
                const [title, description] = value.split(' - ');
                return (
                  <div key={index} className="bg-gray-50 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                    <p className="text-gray-600">{description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Meet Our Team
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Fragrance experts dedicated to helping you find your perfect scent
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TEAM_MEMBERS.map((member, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                  <img
                    src={member.image_url}
                    alt={member.name}
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{member.name}</h3>
                    <p className="text-blue-600 font-medium mb-3">{member.position}</p>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">{member.bio}</p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">Expertise:</p>
                      <div className="flex flex-wrap gap-2">
                        {member.expertise.map((skill, skillIndex) => (
                          <span
                            key={skillIndex}
                            className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business Credentials */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Trust & Authenticity
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Our credentials and commitments to quality
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {BUSINESS_CREDENTIALS.map((credential, index) => (
                <div key={index} className="text-center group">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden group-hover:scale-105 transition-transform duration-200">
                    <img
                      src={credential.image_url}
                      alt={credential.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{credential.name}</h3>
                  <p className="text-sm text-blue-600 font-medium mb-2">{credential.type}</p>
                  <p className="text-gray-600 text-sm">{credential.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Customer Testimonials */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                What Our Customers Say
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Real experiences from verified customers
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center mb-4">
                    <div className="flex">{renderStars(testimonial.rating)}</div>
                    {testimonial.verified && (
                      <span className="ml-2 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 leading-relaxed">"{testimonial.comment}"</p>
                  <p className="text-sm font-medium text-gray-900">— {testimonial.customer_name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA Section */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Let's Connect
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Have questions about our products or need personalized fragrance advice? 
              We're here to help you find your perfect scent.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/contact"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Contact Us
              </Link>
              <Link
                to="/products"
                className="border-2 border-white hover:bg-white hover:text-blue-600 text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200"
              >
                Browse Products
              </Link>
            </div>
            
            {/* Social Media Links */}
            <div className="mt-12 pt-8 border-t border-blue-500">
              <p className="text-blue-100 mb-4">Follow us on social media</p>
              <div className="flex justify-center space-x-6">
                <a href="#" className="text-blue-100 hover:text-white transition-colors" aria-label="Facebook">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="#" className="text-blue-100 hover:text-white transition-colors" aria-label="Instagram">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987c6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C3.85 14.81 3.304 13.104 3.304 12c0-1.297.49-2.448 1.297-3.323C5.378 7.85 7.084 7.304 8.449 7.304c1.297 0 2.448.49 3.323 1.297.876.876 1.297 2.026 1.297 3.323 0 1.104-.49 2.448-1.297 3.323-.875.876-2.026 1.297-3.323 1.297z"/>
                  </svg>
                </a>
                <a href="#" className="text-blue-100 hover:text-white transition-colors" aria-label="Twitter">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default UV_About;