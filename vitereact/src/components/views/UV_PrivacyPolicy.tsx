import React, { useState, useEffect } from 'react';
import { useAppStore } from '@/store/main';

// Types for privacy policy structure
interface PolicySection {
  title: string;
  content: string;
  subsections?: {
    title: string;
    content: string;
  }[];
}

interface GDPRRight {
  right_name: string;
  description: string;
  process: string;
}

const UV_PrivacyPolicy: React.FC = () => {
  // State variables as defined in the specification
  const [policy_content, setPolicyContent] = useState<{ sections: PolicySection[] } | null>(null);
  const [last_updated, setLastUpdated] = useState<Date | null>(null);
  const [user_consent_status, setUserConsentStatus] = useState<boolean | null>(null);
  const [loading_policy, setLoadingPolicy] = useState<boolean>(false);
  const [gdpr_rights, setGdprRights] = useState<GDPRRight[]>([]);

  // Global state access - individual selectors to avoid infinite loops
  const currentUser = useAppStore(state => state.authentication_state.current_user);
  const isAuthenticated = useAppStore(state => state.authentication_state.authentication_status.is_authenticated);

  // Load privacy policy content on component mount
  useEffect(() => {
    setLoadingPolicy(true);
    
    // Simulate loading comprehensive privacy policy content
    setTimeout(() => {
      setPolicyContent({
        sections: [
          {
            title: "Information We Collect",
            content: "We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.",
            subsections: [
              {
                title: "Personal Information",
                content: "This includes your name, email address, phone number, shipping address, and payment information when you make a purchase."
              },
              {
                title: "Usage Information", 
                content: "We automatically collect information about how you use our website, including your IP address, browser type, pages visited, and time spent on our site."
              },
              {
                title: "Cookies and Tracking Technologies",
                content: "We use cookies, web beacons, and similar technologies to enhance your experience, analyze site usage, and for marketing purposes."
              }
            ]
          },
          {
            title: "How We Use Your Information",
            content: "We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.",
            subsections: [
              {
                title: "Service Provision",
                content: "To process orders, manage your account, provide customer support, and deliver products to you."
              },
              {
                title: "Communication",
                content: "To send you order confirmations, shipping notifications, marketing communications (with your consent), and important updates about our services."
              },
              {
                title: "Improvement and Analytics",
                content: "To analyze usage patterns, improve our website functionality, and develop new features and services."
              }
            ]
          },
          {
            title: "Information Sharing and Disclosure",
            content: "We do not sell, trade, or rent your personal information to third parties. We may share your information in limited circumstances as outlined below.",
            subsections: [
              {
                title: "Service Providers",
                content: "We share information with trusted third-party service providers who help us operate our business, such as payment processors, shipping companies, and email service providers."
              },
              {
                title: "Legal Requirements",
                content: "We may disclose your information if required by law, court order, or government request, or to protect our rights and safety."
              },
              {
                title: "Business Transfers",
                content: "In the event of a merger, acquisition, or sale of assets, your information may be transferred to the new entity."
              }
            ]
          },
          {
            title: "Data Security",
            content: "We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
            subsections: [
              {
                title: "Encryption",
                content: "All sensitive data is encrypted in transit using SSL/TLS protocols and at rest using industry-standard encryption methods."
              },
              {
                title: "Access Controls",
                content: "We maintain strict access controls and only authorized personnel have access to personal information on a need-to-know basis."
              },
              {
                title: "Regular Security Audits",
                content: "We conduct regular security assessments and updates to ensure our security measures remain effective."
              }
            ]
          },
          {
            title: "Data Retention",
            content: "We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, comply with legal obligations, and resolve disputes.",
            subsections: [
              {
                title: "Account Information",
                content: "Account information is retained for as long as your account remains active or as needed to provide services."
              },
              {
                title: "Transaction Records",
                content: "Order and payment information is retained for 7 years for accounting and tax purposes, or as required by law."
              },
              {
                title: "Marketing Communications",
                content: "Marketing preferences and communications are retained until you unsubscribe or request deletion."
              }
            ]
          },
          {
            title: "International Data Transfers",
            content: "Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place for such transfers.",
            subsections: [
              {
                title: "Adequacy Decisions",
                content: "We transfer data to countries with adequacy decisions from the European Commission where applicable."
              },
              {
                title: "Standard Contractual Clauses",
                content: "For transfers to other countries, we use Standard Contractual Clauses approved by the European Commission."
              }
            ]
          },
          {
            title: "Your Rights and Choices",
            content: "You have certain rights regarding your personal information, including the right to access, correct, delete, or restrict processing of your data.",
            subsections: [
              {
                title: "Account Management",
                content: "You can update your account information and preferences at any time through your account dashboard."
              },
              {
                title: "Marketing Opt-out",
                content: "You can unsubscribe from marketing communications by clicking the unsubscribe link in emails or updating your preferences."
              },
              {
                title: "Data Requests",
                content: "You can request access to, correction of, or deletion of your personal information by contacting our privacy team."
              }
            ]
          },
          {
            title: "Children's Privacy",
            content: "Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.",
            subsections: [
              {
                title: "Age Verification",
                content: "If we learn that we have collected personal information from a child under 13, we will delete that information immediately."
              },
              {
                title: "Parental Rights",
                content: "Parents can contact us to review, delete, or stop the collection of personal information from their child."
              }
            ]
          },
          {
            title: "Contact Information",
            content: "If you have questions about this privacy policy or our privacy practices, please contact us using the information below.",
            subsections: [
              {
                title: "Privacy Officer",
                content: "Email: privacy@perfumeshop.com | Phone: +1 (555) 123-4567"
              },
              {
                title: "Mailing Address",
                content: "PerfumeShop Privacy Team, 123 Fragrance Avenue, Suite 100, New York, NY 10001"
              },
              {
                title: "Data Protection Authority",
                content: "You have the right to lodge a complaint with your local data protection authority if you believe we have not handled your personal information properly."
              }
            ]
          }
        ]
      });

      setGdprRights([
        {
          right_name: "Right of Access",
          description: "You have the right to request access to your personal information and receive information about how we process it.",
          process: "Submit a request through our privacy contact form or email privacy@perfumeshop.com. We will respond within 30 days."
        },
        {
          right_name: "Right to Rectification",
          description: "You have the right to request correction of inaccurate or incomplete personal information.",
          process: "Log into your account to update information directly, or contact our privacy team for assistance."
        },
        {
          right_name: "Right to Erasure",
          description: "You have the right to request deletion of your personal information in certain circumstances.",
          process: "Contact our privacy team with your deletion request. We will evaluate and respond within 30 days."
        },
        {
          right_name: "Right to Restrict Processing",
          description: "You have the right to request that we limit how we process your personal information in certain situations.",
          process: "Submit a restriction request explaining the circumstances. We will review and implement appropriate restrictions."
        },
        {
          right_name: "Right to Data Portability",
          description: "You have the right to receive your personal information in a structured, machine-readable format.",
          process: "Request a data export through your account settings or contact our privacy team."
        },
        {
          right_name: "Right to Object",
          description: "You have the right to object to certain types of processing, including direct marketing.",
          process: "Use the unsubscribe link in marketing emails or contact us to opt out of specific processing activities."
        }
      ]);

      setLastUpdated(new Date('2024-01-15'));
      setLoadingPolicy(false);
    }, 500);
  }, []);

  // Load user consent status for authenticated users
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      // Since there's no API endpoint, simulate user consent status
      // In a real implementation, this would fetch from the backend
      setUserConsentStatus(true); // Assume user has given consent
    } else {
      setUserConsentStatus(null);
    }
  }, [isAuthenticated, currentUser]);

  // Record user consent action
  const recordUserConsent = async () => {
    if (!isAuthenticated) return;

    try {
      // Since the API endpoint is missing, simulate the consent recording
      // In a real implementation, this would call the backend API
      console.log('Recording user consent for user:', currentUser?.user_id);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUserConsentStatus(true);
      
      // Show success feedback
      alert('Your consent has been recorded successfully.');
    } catch (error) {
      console.error('Error recording user consent:', error);
      alert('Failed to record consent. Please try again.');
    }
  };

  return (
    <>
      {loading_policy ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" aria-label="Loading privacy policy"></div>
        </div>
      ) : (
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <p className="text-gray-600 mb-4 sm:mb-0">
                  Last updated: {last_updated?.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                {isAuthenticated && (
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600">
                      Consent Status: 
                      <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                        user_consent_status 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {user_consent_status ? 'Acknowledged' : 'Pending'}
                      </span>
                    </span>
                    {!user_consent_status && (
                      <button
                        onClick={recordUserConsent}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                        aria-label="Acknowledge privacy policy consent"
                      >
                        Acknowledge
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Privacy Policy Content */}
            {policy_content && (
              <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                <div className="prose prose-gray max-w-none">
                  <div className="mb-8">
                    <p className="text-lg text-gray-700 leading-relaxed">
                      At PerfumeShop, we are committed to protecting your privacy and ensuring the security of your personal information. 
                      This Privacy Policy explains how we collect, use, share, and protect your information when you use our website and services.
                    </p>
                  </div>

                  {policy_content.sections.map((section, sectionIndex) => (
                    <div key={sectionIndex} className="mb-12">
                      <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                        {sectionIndex + 1}. {section.title}
                      </h2>
                      <p className="text-gray-700 mb-6 leading-relaxed">
                        {section.content}
                      </p>
                      
                      {section.subsections && section.subsections.length > 0 && (
                        <div className="space-y-6">
                          {section.subsections.map((subsection, subsectionIndex) => (
                            <div key={subsectionIndex} className="ml-4 border-l-4 border-blue-100 pl-6">
                              <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {subsection.title}
                              </h3>
                              <p className="text-gray-700 leading-relaxed">
                                {subsection.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* GDPR Rights Section */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Your Rights Under GDPR</h2>
              <p className="text-gray-700 mb-8 leading-relaxed">
                If you are located in the European Union, you have the following rights regarding your personal data:
              </p>
              
              <div className="grid md:grid-cols-2 gap-6">
                {gdpr_rights.map((right, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      {right.right_name}
                    </h3>
                    <p className="text-gray-700 mb-4 text-sm leading-relaxed">
                      {right.description}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <p className="text-blue-800 text-sm font-medium mb-1">How to Exercise This Right:</p>
                      <p className="text-blue-700 text-sm">
                        {right.process}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy Questions?</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact us:
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Email Us</h3>
                  <p className="text-blue-600">privacy@perfumeshop.com</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Call Us</h3>
                  <p className="text-blue-600">+1 (555) 123-4567</p>
                </div>
                <div className="sm:col-span-2">
                  <h3 className="font-medium text-gray-900 mb-2">Mail Us</h3>
                  <p className="text-gray-700">
                    PerfumeShop Privacy Team<br />
                    123 Fragrance Avenue, Suite 100<br />
                    New York, NY 10001
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center text-sm text-gray-500">
              <p>
                This privacy policy is effective as of {last_updated?.toLocaleDateString('en-US')} and may be updated from time to time. 
                We will notify you of any material changes to this policy.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_PrivacyPolicy;