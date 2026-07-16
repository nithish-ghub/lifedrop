import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { FaTint } from 'react-icons/fa';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.data.success) {
        setSuccess('Password reset link sent! Check your email inbox (and spam folder).');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
          <div className="text-center">
            <div className="flex justify-center text-primary-500">
              <FaTint className="h-12 w-12 animate-bounce" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Forgot Password</h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter your email to receive a password reset link
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-600 border border-green-100">
              ✅ {success}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 focus:outline-none disabled:opacity-50 transition-colors shadow-md shadow-primary-500/10"
            >
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Back to{' '}
            <Link to="/login" className="font-bold text-primary-500 hover:text-primary-600">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
