import React, { useState, useEffect } from 'react';
import { hospitalAPI, requestAPI, donorAPI } from '../services/api';
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
  FaPlusCircle,
  FaCheck,
  FaHourglassHalf,
  FaExchangeAlt,
} from 'react-icons/fa';

const HospitalDashboard = () => {
  const { user, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  // Metrics, inventory, and requests
  const [metrics, setMetrics] = useState(null);
  const [inventory, setInventory] = useState({});
  const [requests, setRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Form & Search states
  const [reqForm, setReqForm] = useState({
    patientName: '',
    phone: '',
    bloodGroup: '',
    unitsRequired: 1,
    emergencyLevel: 'high',
    reason: '',
  });

  const [searchGroup, setSearchGroup] = useState('');
  const [searchDist, setSearchDist] = useState(30);
  const [nearbyDonors, setNearbyDonors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const fetchHospitalData = async () => {
    try {
      // 1. Fetch metrics
      const metricsRes = await hospitalAPI.getDashboard();
      if (metricsRes.data.success) {
        setMetrics(metricsRes.data.data);
        setInventory(metricsRes.data.data.bloodInventory || {});
      }

      // 2. Fetch requests
      const reqRes = await requestAPI.getRequests();
      if (reqRes.data.success) {
        setRequests(reqRes.data.data);
      }

      // 3. Fetch notifications
      const notifRes = await donorAPI.getNotifications();
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not synch hospital dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
  }, []);

  // Socket notification handlers
  useEffect(() => {
    if (!socket) return;

    socket.on('request_accepted', (data) => {
      setMsg(`✅ DONOR FOUND: ${data.donor.name} accepted request for patient ${data.request.patientName}!`);
      fetchHospitalData();
    });

    return () => {
      socket.off('request_accepted');
    };
  }, [socket]);

  const handleUpdateInventory = async (group, quantity) => {
    try {
      const res = await hospitalAPI.updateInventory(group, quantity);
      if (res.data.success) {
        setInventory(res.data.data);
        setMsg(`Blood bag inventory for ${group} updated successfully.`);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update inventory bag quantities.');
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    setError('');
    setMsg('');

    if (
      !reqForm.patientName ||
      !reqForm.phone ||
      !reqForm.bloodGroup ||
      !reqForm.unitsRequired
    ) {
      setError('Please fill in patient name, phone, blood group and required units.');
      return;
    }

    if (!user.location || !user.location.coordinates) {
      setError('Hospital location coordinates are missing in your profile. Please contact support.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...reqForm,
        unitsRequired: Number(reqForm.unitsRequired),
        hospitalName: user.name, // Auto set hospital name
        latitude: user.location.coordinates[1], // Auto default to hospital GPS
        longitude: user.location.coordinates[0],
      };
      
      const res = await requestAPI.createRequest(payload);
      if (res.data.success) {
        setMsg(`Emergency request created! Dispatched to ${res.data.notifiedCount} available nearest donors.`);
        // Reset form
        setReqForm({
          patientName: '',
          phone: '',
          bloodGroup: '',
          unitsRequired: 1,
          emergencyLevel: 'high',
          reason: '',
        });
        fetchHospitalData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to dispatch request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteRequest = async (id) => {
    if (!window.confirm('Do you confirm that this donor has successfully completed the blood donation?')) {
      return;
    }
    try {
      const res = await requestAPI.completeRequest(id);
      if (res.data.success) {
        setMsg('Donation completed! History logs saved and donor metrics updated.');
        fetchHospitalData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to close request.');
    }
  };

  const handleCancelRequest = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this emergency request?')) {
      return;
    }
    try {
      const res = await requestAPI.cancelRequest(id);
      if (res.data.success) {
        setMsg('Request cancelled successfully.');
        fetchHospitalData();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to cancel request.');
    }
  };

  const handleSearchDonors = async () => {
    setError('');
    try {
      const res = await hospitalAPI.getNearbyDonors(searchGroup, searchDist);
      if (res.data.success) {
        setNearbyDonors(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to query nearby available donors.');
    }
  };

  // Trigger default nearby donor search on mount or tab focus
  useEffect(() => {
    if (user && user.location) {
      handleSearchDonors();
    }
  }, [user]);

  // Leaflet Map Markers
  const markers = [];
  if (user && user.location && user.location.coordinates) {
    markers.push({
      position: [user.location.coordinates[1], user.location.coordinates[0]],
      type: 'hospital',
      popup: { title: user.name, description: 'My Hospital Location' },
    });
  }

  nearbyDonors.forEach((donor) => {
    if (donor.location && donor.location.coordinates) {
      markers.push({
        position: [donor.location.coordinates[1], donor.location.coordinates[0]],
        type: 'donor',
        popup: {
          title: `Donor: ${donor.name} (${donor.bloodGroup})`,
          description: `Distance: ${donor.distance} km away. Phone: ${donor.phone}`,
        },
      });
    }
  });

  const bloodGroupsList = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Hospital Console</h1>
            <p className="text-sm text-gray-500 mt-1">Facility: {user?.name}. Check blood stocks and dispatch alerts.</p>
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

        {/* Top Summary Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                <FaHeartbeat className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{metrics.totalRequests}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Requests Dispatched</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <FaHourglassHalf className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{metrics.pendingRequests}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Pending Search</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-green-500 rounded-xl">
                <FaCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{metrics.completedRequests}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Completed Donations</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                <FaUserFriends className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{metrics.nearbyDonorsCount}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Nearby Available Donors</p>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Blood Bag Inventory Tracker */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FaExchangeAlt className="text-primary-500 mr-2" /> Blood Bag Inventory
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {bloodGroupsList.map((group) => {
                  const qty = inventory[group] || 0;
                  return (
                    <div key={group} className="border p-4 rounded-xl text-center space-y-2 bg-gray-50">
                      <span className="inline-block bg-primary-500 text-white font-extrabold px-3 py-1 rounded text-xs">
                        {group}
                      </span>
                      <p className="text-xl font-black text-gray-900">{qty} Bags</p>
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => handleUpdateInventory(group, qty + 1)}
                          className="rounded bg-white border border-gray-200 w-7 h-7 text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleUpdateInventory(group, Math.max(0, qty - 1))}
                          className="rounded bg-white border border-gray-200 w-7 h-7 text-xs font-bold text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Live Map / Donor Search Interface */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-gray-800">Map Available Donors</h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  <select
                    value={searchGroup}
                    onChange={(e) => setSearchGroup(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">All Blood Types</option>
                    {bloodGroupsList.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={searchDist}
                    onChange={(e) => setSearchDist(e.target.value)}
                    placeholder="Dist km"
                    className="w-20 rounded-lg border border-gray-200 px-2 py-2 text-xs focus:outline-none"
                  />
                  <button
                    onClick={handleSearchDonors}
                    className="rounded-lg bg-primary-500 px-4 py-2 text-xs font-bold text-white hover:bg-primary-600"
                  >
                    Search
                  </button>
                </div>
              </div>

              <div className="h-80 rounded-xl overflow-hidden">
                <LeafletMap
                  center={user?.location?.coordinates ? [user.location.coordinates[1], user.location.coordinates[0]] : undefined}
                  zoom={11}
                  markers={markers}
                />
              </div>
            </div>

            {/* Dispatch Emergency Request */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                <FaPlusCircle className="text-primary-500 mr-2" /> Dispatch Emergency Blood Request
              </h2>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Patient Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="Patient Full Name"
                      value={reqForm.patientName}
                      onChange={(e) => setReqForm({ ...reqForm, patientName: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Patient Phone *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contact number"
                      value={reqForm.phone}
                      onChange={(e) => setReqForm({ ...reqForm, phone: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Blood Group Needed *</label>
                    <select
                      required
                      value={reqForm.bloodGroup}
                      onChange={(e) => setReqForm({ ...reqForm, bloodGroup: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">Select Group</option>
                      {bloodGroupsList.map((g) => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Units Required (Bags) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={reqForm.unitsRequired}
                      onChange={(e) => setReqForm({ ...reqForm, unitsRequired: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Emergency Priority *</label>
                    <select
                      required
                      value={reqForm.emergencyLevel}
                      onChange={(e) => setReqForm({ ...reqForm, emergencyLevel: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700">Medical Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Surgery, Accident trauma"
                      value={reqForm.reason}
                      onChange={(e) => setReqForm({ ...reqForm, reason: e.target.value })}
                      className="mt-1 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-xs text-gray-400 bg-gray-50 p-2.5 rounded-lg border">
                  📍 Request coordinates will automatically default to your hospital coordinates: [{user?.location?.coordinates?.join(', ')}]
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center rounded-lg bg-primary-500 py-3 text-sm font-bold text-white hover:bg-primary-600 disabled:opacity-50 transition-colors shadow-md shadow-primary-500/10"
                >
                  {isSubmitting ? 'Dispatching...' : 'Dispatch Emergency request'}
                </button>
              </form>
            </div>
          </div>

          {/* Manage Active Dispatches (Right Column) */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Active Dispatches</h3>
              {requests.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400 italic">No emergency requests created.</p>
              ) : (
                <div className="space-y-4">
                  {requests.map((r) => (
                    <div key={r._id} className="p-4 border rounded-xl bg-gray-50 text-xs space-y-2">
                      <div className="flex justify-between items-center font-bold">
                        <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded text-[10px]">{r.bloodGroup}</span>
                        <span
                          className={`uppercase text-[9px] px-2 py-0.5 rounded-full ${
                            r.status === 'completed'
                              ? 'bg-green-50 text-green-700'
                              : r.status === 'cancelled'
                              ? 'bg-gray-150 text-gray-500'
                              : 'bg-yellow-50 text-yellow-700 animate-pulse'
                          }`}
                        >
                          {r.status}
                        </span>
                      </div>
                      <p className="font-bold text-gray-800 text-sm">Patient: {r.patientName}</p>
                      <p className="text-gray-400">Date: {new Date(r.createdAt).toLocaleDateString()}</p>
                      
                      {r.status === 'accepted' && r.assignedDonor && (
                        <div className="border-t pt-2 space-y-2">
                          <p className="font-bold text-green-700">✓ Donor Found!</p>
                          <p className="text-gray-600">
                            <strong>Donor:</strong> {r.assignedDonor.name}
                          </p>
                          <p className="text-gray-600">
                            <strong>Phone:</strong> {r.assignedDonor.phone}
                          </p>
                          <button
                            onClick={() => handleCompleteRequest(r._id)}
                            className="w-full rounded bg-green-500 py-1.5 font-bold text-white hover:bg-green-600 transition-colors"
                          >
                            Mark as Completed
                          </button>
                        </div>
                      )}

                      {r.status === 'pending' && (
                        <div className="border-t pt-2">
                          <button
                            onClick={() => handleCancelRequest(r._id)}
                            className="w-full rounded bg-gray-200 py-1 text-gray-600 hover:bg-gray-300"
                          >
                            Cancel Search
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
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

export default HospitalDashboard;
