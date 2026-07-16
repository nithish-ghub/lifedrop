import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTint, FaMapMarkerAlt } from 'react-icons/fa';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';

const RegisterHospital = () => {
  const { registerHospital } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    licenseNumber: '',
    city: '',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setDetecting(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setDetecting(false);
      },
      (err) => {
        console.error(err);
        setError('Unable to retrieve location. Please grant permission or enter manually.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone ||
      !formData.licenseNumber ||
      !formData.city ||
      !formData.address
    ) {
      setError('Please fill in all the required fields marked with *');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please capture your hospital coordinate locations.');
      return;
    }

    setLoading(true);
    const result = await registerHospital({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      phone: formData.phone,
      licenseNumber: formData.licenseNumber,
      city: formData.city,
      district: formData.district,
      address: formData.address,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
    });
    setLoading(false);

    if (result.success) {
      setSuccess('Hospital registered successfully! Admin approval is pending. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-8 rounded-2xl border border-gray-100 bg-white p-8 shadow-md">
          <div className="text-center">
            <div className="flex justify-center text-primary-500">
              <FaTint className="h-10 w-10 animate-bounce" />
            </div>
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Hospital Registration</h2>
            <p className="mt-2 text-sm text-gray-500">
              Connect your facility to our emergency donor routing network.
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
            {/* Core details */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Hospital Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. City General Hospital"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medical License Number *</label>
                  <input
                    type="text"
                    name="licenseNumber"
                    required
                    value={formData.licenseNumber}
                    onChange={handleChange}
                    placeholder="License ID / Reg Code"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Email *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="info@hospital.org"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hospital Phone *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 80 1234 5678"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address & Location */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Facility Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">District</label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="District"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Detailed Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Street name, landmark details"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coordinates block */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Geospatial Coordinates</h4>
                    <p className="text-xs text-gray-400">Required for donor mapping</p>
                  </div>
                  <button
                    type="button"
                    onClick={detectLocation}
                    disabled={detecting}
                    className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-xs font-bold text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
                  >
                    <FaMapMarkerAlt className="mr-1.5" />
                    {detecting ? 'Detecting...' : 'Detect GPS Location'}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Latitude</label>
                    <input
                      type="text"
                      name="latitude"
                      readOnly
                      placeholder="e.g. 12.9716"
                      value={formData.latitude}
                      className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500">Longitude</label>
                    <input
                      type="text"
                      name="longitude"
                      readOnly
                      placeholder="e.g. 77.5946"
                      value={formData.longitude}
                      className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 focus:outline-none disabled:opacity-50 transition-colors shadow-md shadow-primary-500/10"
            >
              {loading ? 'Submitting...' : 'Register Hospital'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{' '}
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

export default RegisterHospital;
