import React from 'react';
import { Link } from 'react-router-dom';
import { FaTint, FaHeart } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          <div className="space-y-8 xl:col-span-1">
            <Link to="/" className="flex items-center space-x-2 text-2xl font-black tracking-tight text-gray-900">
              <FaTint className="h-6 w-6 text-primary-500" />
              <span>
                Life<span className="text-primary-500">Drop</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500">
              Connecting hospitals and patients with emergency blood donors near them, instantly. Saving lives, drop by drop.
            </p>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">System</h3>
                <ul className="mt-4 space-y-4">
                  <li>
                    <Link to="/login" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link to="/register-donor" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                      Register Donor
                    </Link>
                  </li>
                  <li>
                    <Link to="/register-hospital" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                      Register Hospital
                    </Link>
                  </li>
                  <li>
                    <Link to="/register-patient" className="text-sm text-gray-500 hover:text-primary-500 transition-colors">
                      Register Patient
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-12 md:mt-0">
                <h3 className="text-sm font-semibold tracking-wider text-gray-400 uppercase">Emergency</h3>
                <ul className="mt-4 space-y-4">
                  <li className="text-sm text-gray-500 font-bold">
                    Helpline: <span className="text-primary-500">102</span>
                  </li>
                  <li className="text-sm text-gray-500">
                    Email: support@lifedrop.org
                  </li>
                  <li className="text-sm text-gray-500">
                    Location: India
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} LifeDrop Network. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 flex items-center mt-4 md:mt-0">
            Made with <FaHeart className="mx-1 text-primary-500" /> for humanity.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
