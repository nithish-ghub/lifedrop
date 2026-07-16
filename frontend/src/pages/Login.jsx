import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTint } from 'react-icons/fa';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';

const Login = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is already logged in, redirect them
  useEffect(() => {
    if (user) {
      if (redirect) {
        if (redirect === 'patient' && user.role === 'patient') {
          navigate('/patient/dashboard');
        } else {
          navigate(`/${user.role}/dashboard`);
        }
      } else {
        navigate(`/${user.role}/dashboard`);
      }
    }
  }, [user, navigate, redirect]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.message);
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
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Sign In to LifeDrop</h2>
            <p className="mt-2 text-sm text-gray-500">
              Access your dashboard and emergency actions
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
              ⚠️ {error}
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-primary-500 hover:text-primary-600"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full rounded-lg border border-gray-200 px-4 py-3 text-sm focus:border-primary-500 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full flex justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 focus:outline-none disabled:opacity-50 transition-colors shadow-md shadow-primary-500/10"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Register New Account As
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Link
                to="/register-donor"
                className="flex items-center justify-center rounded-lg border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Donor
              </Link>
              <Link
                to="/register-hospital"
                className="flex items-center justify-center rounded-lg border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hospital
              </Link>
              <Link
                to="/register-patient"
                className="flex items-center justify-center rounded-lg border border-gray-200 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Patient
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
