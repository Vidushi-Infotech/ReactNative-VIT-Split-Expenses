import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-md border-b border-white/20 shadow-lg">
        <nav className="py-4">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Splitzy Logo" className="w-8 h-8" />
              <Link to="/" className="text-2xl font-bold gradient-text">Splitzy</Link>
            </div>
            <Link to="/" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">
              Back to Home
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-24 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Privacy Policy</h1>
            
            <div className="prose prose-lg max-w-none space-y-6">
              <p className="text-gray-600 text-lg leading-relaxed">
                <strong>Effective Date:</strong> January 1, 2025
              </p>
              
              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Welcome to Splitzy ("we," "our," or "us"). We are committed to protecting your privacy and personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Name and email address</li>
                    <li>Phone number (optional)</li>
                    <li>Profile picture (optional)</li>
                    <li>Payment information (processed securely through third-party providers)</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-4">Usage Information</h3>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Expense data and transaction history</li>
                    <li>Group membership and activity</li>
                    <li>App usage patterns and preferences</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Provide and maintain our expense splitting services</li>
                    <li>Process transactions and calculate balances</li>
                    <li>Send notifications about group activities and balances</li>
                    <li>Improve our app functionality and user experience</li>
                    <li>Provide customer support</li>
                    <li>Comply with legal obligations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    We do not sell, trade, or otherwise transfer your personal information to third parties except in the following circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>With group members for expense sharing purposes</li>
                    <li>With service providers who assist in our operations</li>
                    <li>When required by law or legal process</li>
                    <li>To protect our rights and safety</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. We use industry-standard encryption for data transmission and storage.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Access and update your personal information</li>
                    <li>Delete your account and associated data</li>
                    <li>Opt out of promotional communications</li>
                    <li>Request a copy of your data</li>
                    <li>Withdraw consent where applicable</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We retain your personal information only for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete your personal information within 30 days, except where required by law.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Changes to This Policy</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the effective date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                  <p className="text-gray-600 leading-relaxed">
                    If you have any questions about this Privacy Policy, please contact us at:
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg mt-4">
                    <p className="text-gray-700">Email: support@splitzy.in</p>
                    <p className="text-gray-700">Phone: +1 (555) 123-4567</p>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PrivacyPolicy;