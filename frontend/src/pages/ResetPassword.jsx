import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { FaTint } from 'react-icons/fa';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!password || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, password);
      if (res.data.success) {
        setSuccess('Password updated successfully! Redirecting to login page...');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Token is invalid or expired. Please request a new link.');
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
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Reset Password</h2>
            <p className="mt-2 text-sm text-gray-500">
              Enter your new account password below
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700">New Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 focus:outline-none disabled:opacity-50 transition-colors shadow-md shadow-primary-500/10"
            >
              {loading ? 'Resetting password...' : 'Update Password'}
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

export default ResetPassword;
