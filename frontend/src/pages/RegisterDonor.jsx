import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaTint, FaMapMarkerAlt } from 'react-icons/fa';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';

const RegisterDonor = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    age: '',
    gender: '',
    bloodGroup: '',
    weight: '',
    city: '',
    district: '',
    address: '',
    latitude: '',
    longitude: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
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

    // Perform validation
    if (
      !formData.name ||
      !formData.email ||
      !formData.password ||
      !formData.phone ||
      !formData.age ||
      !formData.gender ||
      !formData.bloodGroup ||
      !formData.weight ||
      !formData.city ||
      !formData.address
    ) {
      setError('Please fill in all the required fields marked with *');
      return;
    }

    if (Number(formData.age) < 18 || Number(formData.age) > 65) {
      setError('Donor must be between 18 and 65 years old.');
      return;
    }

    if (Number(formData.weight) < 45) {
      setError('Donor weight must be at least 45 kg.');
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      setError('Please capture your current latitude and longitude coordinates.');
      return;
    }

    setLoading(true);
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      role: 'donor',
      age: Number(formData.age),
      gender: formData.gender,
      bloodGroup: formData.bloodGroup,
      weight: Number(formData.weight),
      city: formData.city,
      district: formData.district,
      address: formData.address,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      emergencyContact: {
        name: formData.emergencyContactName,
        phone: formData.emergencyContactPhone,
        relationship: formData.emergencyContactRelationship,
      },
    };

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      setSuccess('Donor registered successfully! Redirecting...');
      setTimeout(() => navigate('/donor/dashboard'), 1500);
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
            <h2 className="mt-4 text-3xl font-extrabold text-gray-900">Register as a Blood Donor</h2>
            <p className="mt-2 text-sm text-gray-500">
              Be a lifesaver. Join our smart emergency response network.
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
            {/* Core Info */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Account Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                  <input
                    type="text"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="e.g. +91 9876543210"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
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

            {/* Health Metrics */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Health Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Age *</label>
                  <input
                    type="number"
                    name="age"
                    required
                    value={formData.age}
                    onChange={handleChange}
                    placeholder="e.g. 25"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender *</label>
                  <select
                    name="gender"
                    required
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Blood Group *</label>
                  <select
                    name="bloodGroup"
                    required
                    value={formData.bloodGroup}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg) *</label>
                  <input
                    type="number"
                    name="weight"
                    required
                    value={formData.weight}
                    onChange={handleChange}
                    placeholder="e.g. 70"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Address & Location */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Address & Location</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City Name"
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
                    placeholder="Street, Building info"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Coordinates block */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Geospatial Coordinates</h4>
                    <p className="text-xs text-gray-400">Required for nearby calculations</p>
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

            {/* Emergency Contact */}
            <div className="bg-gray-50 p-4 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Name</label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Name"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contact Phone</label>
                  <input
                    type="text"
                    name="emergencyContactPhone"
                    value={formData.emergencyContactPhone}
                    onChange={handleChange}
                    placeholder="Phone"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship</label>
                  <input
                    type="text"
                    name="emergencyContactRelationship"
                    value={formData.emergencyContactRelationship}
                    onChange={handleChange}
                    placeholder="e.g. Spouse, Parent"
                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 focus:outline-none disabled:opacity-50 transition-colors shadow-md shadow-primary-500/10"
            >
              {loading ? 'Registering...' : 'Register as Donor'}
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

export default RegisterDonor;
