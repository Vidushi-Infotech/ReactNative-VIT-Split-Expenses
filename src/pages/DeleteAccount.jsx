import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

// API base URL. Override at build time with VITE_API_BASE_URL.
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://api.kharchasplit.com/api/v1';

const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/;

function DeleteAccount() {
  // Flow steps: 'login' -> 'confirm' -> 'done'
  const [step, setStep] = React.useState('login');

  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [password, setPassword] = React.useState('');

  const [auth, setAuth] = React.useState(null); // { accessToken, user }
  const [confirmText, setConfirmText] = React.useState('');

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!PHONE_REGEX.test(phoneNumber.trim())) {
      setError('Please enter a valid phone number in international format, e.g. +919876543210');
      return;
    }
    if (password.length < 6 || password.length > 128) {
      setError('Password must be between 6 and 128 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          password,
          device: {
            name: 'Web Browser',
            platform: 'web',
            appVersion: 'web',
          },
        }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Login failed. Please check your credentials.');
      }

      const { accessToken, user } = body.data || {};
      if (!accessToken || !user?.id) {
        throw new Error('Unexpected response from server. Please try again.');
      }

      setAuth({ accessToken, user });
      setPassword('');
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users/${auth.user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${auth.accessToken}`,
        },
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok || !body.success) {
        throw new Error(body.message || 'Failed to delete account. Please try again.');
      }

      setAuth(null);
      setStep('done');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="fixed w-full top-0 z-50 bg-white/95 backdrop-blur-md border-b border-white/20 shadow-lg">
        <nav className="py-4">
          <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" style={{ cursor: 'pointer' }}>
              <img src={logo} alt="KharchaSplit Logo" className="w-8 h-8" style={{ pointerEvents: 'none' }} />
              <span className="text-2xl font-bold" style={{ pointerEvents: 'none' }}>
                <span className="text-[#0D5B5B]">Kharcha</span>
                <span className="text-[#FF8C42]">Split</span>
              </span>
            </Link>
            <Link to="/" className="text-gray-600 hover:text-primary-500 font-medium transition-colors">
              Back to Home
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-24 pb-20">
        <div className="max-w-md mx-auto px-6">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10">
            <h1 className="text-3xl font-bold text-gray-900 mb-2 text-center">Delete Account</h1>
            <p className="text-gray-500 text-center mb-8">
              Permanently delete your KharchaSplit account and all associated data.
            </p>

            {error && (
              <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {step === 'login' && (
              <>
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  For your security, please sign in to confirm it's really you before deleting your account.
                </div>

                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label htmlFor="phoneNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      id="phoneNumber"
                      type="tel"
                      autoComplete="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+919876543210"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30 transition-colors"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full bg-gradient-to-r from-primary-600 to-purple-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {loading ? 'Verifying…' : 'Continue'}
                  </button>
                </form>
              </>
            )}

            {step === 'confirm' && auth && (
              <div className="space-y-6">
                <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  Signed in as{' '}
                  <span className="font-semibold text-gray-900">
                    {auth.user.name || auth.user.phoneNumber}
                  </span>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                  <p className="font-semibold mb-2">This action is permanent and cannot be undone.</p>
                  <p>
                    Deleting your account will permanently remove your profile, groups, expenses,
                    and all related data. You will not be able to recover this information.
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmText" className="block text-sm font-semibold text-gray-700 mb-2">
                    Type <span className="font-bold text-red-600">DELETE</span> to confirm
                  </label>
                  <input
                    id="confirmText"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-colors"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading || confirmText.trim() !== 'DELETE'}
                  className="w-full rounded-full bg-red-600 px-6 py-3 font-bold text-white shadow-lg transition-all duration-300 hover:bg-red-700 hover:shadow-2xl hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0 disabled:hover:bg-red-600"
                >
                  {loading ? 'Deleting…' : 'Delete My Account'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuth(null);
                    setConfirmText('');
                    setError('');
                    setStep('login');
                  }}
                  className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Account Deleted</h2>
                  <p className="text-gray-600">
                    Your account and all associated data have been permanently deleted.
                    We're sorry to see you go.
                  </p>
                </div>
                <Link
                  to="/"
                  className="inline-block rounded-full border-2 border-gray-300 px-8 py-3 font-bold text-gray-700 transition-all duration-300 hover:border-primary-500 hover:text-primary-600"
                >
                  Return to Home
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default DeleteAccount;
