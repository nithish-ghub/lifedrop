import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BiMenu, BiX } from 'react-icons/bi';
import { FaTint } from 'react-icons/fa';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    return `/${user.role}/dashboard`;
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // Check if current page is landing page to allow hash scrolling
  const scrollToSection = (id) => {
    setIsOpen(false);
    if (location.pathname !== '/') {
      navigate('/', { state: { scrollTo: id } });
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-black tracking-tight text-gray-900">
              <FaTint className="h-6 w-6 text-primary-500 animate-bounce" />
              <span>
                Life<span className="text-primary-500">Drop</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            <button onClick={() => scrollToSection('about')} className="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
              About
            </button>
            <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
              How it works
            </button>
            <button onClick={() => scrollToSection('statistics')} className="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
              Stats
            </button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
              FAQ
            </button>
            <button onClick={() => scrollToSection('contact')} className="text-sm font-medium text-gray-500 hover:text-primary-500 transition-colors">
              Contact
            </button>

            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={getDashboardLink()}
                  className="rounded-full bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-600 hover:bg-primary-100 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-600 hover:text-primary-500 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register-donor"
                  className="rounded-full bg-primary-500 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-600 shadow-md shadow-primary-500/10 hover:shadow-lg transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
            >
              {isOpen ? <BiX className="h-6 w-6" /> : <BiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="border-b border-gray-100 bg-white md:hidden animate-fade-in">
          <div className="space-y-1 px-2 pb-3 pt-2">
            <button
              onClick={() => scrollToSection('about')}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500"
            >
              How it works
            </button>
            <button
              onClick={() => scrollToSection('statistics')}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500"
            >
              Stats
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection('contact')}
              className="block w-full text-left rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-primary-500"
            >
              Contact
            </button>

            {user ? (
              <div className="border-t border-gray-100 pt-4 mt-2">
                <Link
                  to={getDashboardLink()}
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-semibold text-primary-500 hover:bg-primary-50"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left rounded-md px-3 py-2 text-base font-semibold text-gray-500 hover:bg-gray-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-100 pt-4 mt-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md px-3 py-2 text-base font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/register-donor"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-md bg-primary-500 px-3 py-2 text-center text-base font-semibold text-white hover:bg-primary-600"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
