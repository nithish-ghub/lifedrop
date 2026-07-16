import React, { useState, useEffect } from 'react';
import { requestAPI, donorAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';
import LeafletMap from '../components/Common/LeafletMap';
import {
  FaHeartbeat,
  FaMapMarkerAlt,
  FaBell,
  FaPaperPlane,
  FaUserFriends,
} from 'react-icons/fa';

const PatientDashboard = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  // Request form state
  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    bloodGroup: '',
    unitsRequired: 1,
    hospitalName: '',
    emergencyLevel: 'high',
    reason: '',
    latitude: '',
    longitude: '',
  });

  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [detecting, setDetecting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchPatientData = async () => {
    try {
      const res = await requestAPI.getRequests();
      if (res.data.success) {
        setRequests(res.data.data);
      }

      const notifRes = await donorAPI.getNotifications();
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, []);

  // Socket notification hooks
  useEffect(() => {
    if (!socket) return;

    socket.on('request_accepted', (data) => {
      // Data contains { request, donor }
      setMsg(`✅ DONOR FOUND: ${data.donor.name} has accepted your request!`);
      fetchPatientData();
    });

    socket.on('donation_completed', () => {
      setMsg('🎉 Donation completed! Thank you for using LifeDrop.');
      fetchPatientData();
    });

    return () => {
      socket.off('request_accepted');
      socket.off('donation_completed');
    };
  }, [socket]);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setDetecting(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        }));
        setDetecting(false);
      },
      (err) => {
        console.error(err);
        setError('Location access denied. Enter manually.');
        setDetecting(false);
      }
    );
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (
      !formData.patientName ||
      !formData.phone ||
      !formData.bloodGroup ||
      !formData.unitsRequired ||
      !formData.hospitalName ||
      !formData.latitude ||
      !formData.longitude
    ) {
      setError('Please fill in all requested fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        unitsRequired: Number(formData.unitsRequired),
        latitude: Number(formData.latitude),
        longitude: Number(formData.longitude),
      };
      const res = await requestAPI.createRequest(payload);
      if (res.data.success) {
        setMsg(`Emergency request created! Notified ${res.data.notifiedCount} nearest available donors.`);
        // Reset form
        setFormData({
          patientName: '',
          phone: '',
          bloodGroup: '',
          unitsRequired: 1,
          hospitalName: '',
          emergencyLevel: 'high',
          reason: '',
          latitude: '',
          longitude: '',
        });
        fetchPatientData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to dispatch request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) {
      return;
    }
    try {
      const res = await requestAPI.cancelRequest(id);
      if (res.data.success) {
        setMsg('Request cancelled successfully.');
        fetchPatientData();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to cancel request.');
    }
  };

  const activeRequest = requests.find((r) => r.status === 'pending' || r.status === 'accepted');

  // Markers configuration
  const markers = [];
  let routeCoords = null;

  if (activeRequest && activeRequest.location) {
    markers.push({
      position: [activeRequest.location.coordinates[1], activeRequest.location.coordinates[0]],
      type: 'request',
      popup: {
        title: `My Request (${activeRequest.bloodGroup})`,
        description: `Status: Searching nearest donors...`,
      },
    });

    if (activeRequest.status === 'accepted' && activeRequest.assignedDonor?.location) {
      const donorLoc = activeRequest.assignedDonor.location.coordinates;
      markers.push({
        position: [donorLoc[1], donorLoc[0]],
        type: 'donor',
        popup: {
          title: `Assigned Donor: ${activeRequest.assignedDonor.name}`,
          description: `Phone: ${activeRequest.assignedDonor.phone}`,
        },
      });

      routeCoords = [
        [activeRequest.location.coordinates[1], activeRequest.location.coordinates[0]],
        [donorLoc[1], donorLoc[0]],
      ];
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Messages */}
        {msg && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm font-bold text-green-700 border border-green-100 flex justify-between items-center animate-pulse">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="text-lg hover:text-green-900">×</button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Patient Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Hello, {user?.name}. Request blood emergencies and track donors.</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="mt-4 md:mt-0 rounded-full bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracking Map & List (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Live Tracking Map */}
            {activeRequest && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-gray-800">
                    Live Request Tracker ({activeRequest.bloodGroup})
                  </h3>
                  <span className="inline-flex rounded-full bg-yellow-50 px-3 py-1 text-xs font-bold text-yellow-700 capitalize">
                    Status: {activeRequest.status}
                  </span>
                </div>

                <div className="h-80 rounded-xl overflow-hidden">
                  <LeafletMap
                    center={[activeRequest.location.coordinates[1], activeRequest.location.coordinates[0]]}
                    zoom={13}
                    markers={markers}
                    routeCoords={routeCoords}
                  />
                </div>

                {activeRequest.status === 'accepted' && activeRequest.assignedDonor && (
                  <div className="rounded-xl border border-green-200 bg-green-50/20 p-4 flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-green-800">Donor Dispatched!</h4>
                      <p className="text-xs text-gray-600 mt-1">
                        <strong>Name:</strong> {activeRequest.assignedDonor.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        <strong>Phone:</strong> {activeRequest.assignedDonor.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Arriving At</p>
                      <p className="text-sm font-bold text-gray-800">{activeRequest.hospitalName}</p>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => handleCancelRequest(activeRequest._id)}
                    className="rounded-lg border border-red-200 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
                  >
                    Cancel Request
                  </button>
                </div>
              </div>
            )}

            {/* Create Emergency Request Form */}
            {!activeRequest && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <FaHeartbeat className="text-primary-500 mr-2" /> Request Emergency Blood
                </h2>
                <form onSubmit={handleCreateRequest} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Patient Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Patient Full Name"
                        value={formData.patientName}
                        onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Emergency Phone *</label>
                      <input
                        type="text"
                        required
                        placeholder="Phone Number"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Blood Group Needed *</label>
                      <select
                        required
                        value={formData.bloodGroup}
                        onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      >
                        <option value="">Select Group</option>
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
                      <label className="block text-sm font-semibold text-gray-700">Units Required (Bags) *</label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={formData.unitsRequired}
                        onChange={(e) => setFormData({ ...formData, unitsRequired: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700">Destination Hospital Name & Address *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apollo Hospital, Richmond Road"
                        value={formData.hospitalName}
                        onChange={(e) => setFormData({ ...formData, hospitalName: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Emergency Severity Level *</label>
                      <select
                        required
                        value={formData.emergencyLevel}
                        onChange={(e) => setFormData({ ...formData, emergencyLevel: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical (Immediate danger)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700">Reason / Condition Description</label>
                      <input
                        type="text"
                        placeholder="e.g. Surgery, Accident, etc."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Geolocation mapping */}
                  <div className="bg-gray-50 p-4 rounded-xl space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-bold text-gray-800">Map Destination Location Coordinates</h4>
                        <p className="text-xs text-gray-400">Required for finding nearest donors</p>
                      </div>
                      <button
                        type="button"
                        onClick={detectLocation}
                        disabled={detecting}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600 hover:bg-blue-100 disabled:opacity-50"
                      >
                        {detecting ? 'Locating...' : 'Get Current GPS'}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Latitude *</label>
                        <input
                          type="text"
                          required
                          readOnly
                          placeholder="e.g. 12.9716"
                          value={formData.latitude}
                          className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-150 px-3 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Longitude *</label>
                        <input
                          type="text"
                          required
                          readOnly
                          placeholder="e.g. 77.5946"
                          value={formData.longitude}
                          className="mt-1 block w-full rounded-lg border border-gray-200 bg-gray-150 px-3 py-2 text-xs font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-md shadow-primary-500/10"
                  >
                    <FaPaperPlane className="mr-2 mt-0.5" /> Dispatch Emergency Request
                  </button>
                </form>
              </div>
            )}

            {/* Previous Requests List */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Request History</h2>
              {requests.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400 italic">No previous requests found.</div>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) => (
                    <div key={r._id} className="p-4 border rounded-xl flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="bg-red-50 text-red-700 font-extrabold px-2 py-0.5 rounded">
                            {r.bloodGroup}
                          </span>
                          <span className="capitalize font-semibold text-gray-500">
                            Units: {r.unitsRequired}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-800 mt-2">{r.hospitalName}</h4>
                        <p className="text-gray-400 mt-1">
                          Date: {new Date(r.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            r.status === 'completed'
                              ? 'bg-green-50 text-green-700 border border-green-150'
                              : r.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-600'
                              : 'bg-yellow-50 text-yellow-700'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.assignedDonor && r.status === 'completed' && (
                          <p className="text-[10px] text-gray-400 mt-1.5 font-medium">Donor: {r.assignedDonor.name}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Profile details & alerts */}
          <div className="space-y-8">
            {/* Quick Profile Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Patient Profile</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <p className="text-xs text-gray-400">Full Name</p>
                  <p className="font-bold text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Mobile Phone</p>
                  <p className="font-bold text-gray-900">{user?.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">City / District</p>
                  <p className="font-bold text-gray-900">{user?.city}</p>
                </div>
              </div>
            </div>

            {/* In-app Notifications Drawer */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">
                <FaBell className="inline mr-1 text-primary-500 animate-swing" /> Alerts & Activity
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400 italic">No alerts.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} className="p-3 border rounded-lg bg-gray-50 text-xs text-gray-500">
                      <p className="font-semibold text-gray-700">{n.title}</p>
                      <p className="mt-1 leading-relaxed">{n.message}</p>
                      <span className="text-[10px] text-gray-400 block mt-1">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PatientDashboard;
