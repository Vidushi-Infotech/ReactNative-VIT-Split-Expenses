import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

function TermsConditions() {
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
            <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Terms & Conditions</h1>
            
            <div className="prose prose-lg max-w-none space-y-6">
              <p className="text-gray-600 text-lg leading-relaxed">
                <strong>Effective Date:</strong> January 1, 2025
              </p>
              
              <div className="space-y-6">
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-600 leading-relaxed">
                    By accessing and using Splitzy ("the App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Service</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Splitzy is a mobile application that allows users to track, split, and settle shared expenses with friends, family, and groups. The service includes features for expense management, balance calculations, and group coordination.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>You must provide accurate and complete information when creating an account</li>
                    <li>You are responsible for maintaining the security of your account and password</li>
                    <li>You must notify us immediately of any unauthorized use of your account</li>
                    <li>You must be at least 13 years old to use our service</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Acceptable Use</h2>
                  <p className="text-gray-600 leading-relaxed mb-4">You agree not to use the service to:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe on the rights of others</li>
                    <li>Transmit harmful or malicious content</li>
                    <li>Attempt to gain unauthorized access to our systems</li>
                    <li>Use the service for fraudulent or illegal activities</li>
                    <li>Harass, abuse, or harm other users</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Financial Transactions</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>Splitzy facilitates expense tracking and splitting but does not process payments</li>
                    <li>Users are responsible for settling debts outside of the app</li>
                    <li>We are not responsible for disputes between users regarding payments</li>
                    <li>All expense calculations are provided for informational purposes only</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Intellectual Property</h2>
                  <p className="text-gray-600 leading-relaxed">
                    The service and its original content, features, and functionality are owned by Splitzy and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Privacy</h2>
                  <p className="text-gray-600 leading-relaxed">
                    Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service, to understand our practices.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Termination</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever, including without limitation if you breach the Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Disclaimers</h2>
                  <ul className="list-disc list-inside space-y-2 text-gray-600">
                    <li>The service is provided "as is" without warranties of any kind</li>
                    <li>We do not guarantee the accuracy of expense calculations</li>
                    <li>We are not responsible for user disputes or financial disagreements</li>
                    <li>The service may be interrupted or unavailable from time to time</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Limitation of Liability</h2>
                  <p className="text-gray-600 leading-relaxed">
                    In no event shall Splitzy, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
                  <p className="text-gray-600 leading-relaxed">
                    We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Information</h2>
                  <p className="text-gray-600 leading-relaxed">
                    If you have any questions about these Terms & Conditions, please contact us:
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

export default TermsConditions;