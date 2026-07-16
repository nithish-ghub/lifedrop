import React, { useState, useEffect } from 'react';
import { donorAPI, requestAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';
import LeafletMap from '../components/Common/LeafletMap';
import {
  FaHeartbeat,
  FaMapMarkerAlt,
  FaCalendarCheck,
  FaCheckCircle,
  FaTimes,
  FaBell,
  FaToggleOn,
  FaToggleOff,
} from 'react-icons/fa';

const DonorDashboard = () => {
  const { user, updateProfile, logout } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [activeRequests, setActiveRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Fetch initial profile-based info
  const fetchDonorData = async () => {
    try {
      // 1. Fetch available requests matching this donor (notified list)
      const reqRes = await requestAPI.getRequests();
      if (reqRes.data.success) {
        // Find requests that are pending or accepted by this user
        setActiveRequests(reqRes.data.data);
      }

      // 2. Fetch history
      const historyRes = await donorAPI.getDonationHistory();
      if (historyRes.data.success) {
        setHistory(historyRes.data.data);
      }

      // 3. Fetch notifications
      const notifRes = await donorAPI.getNotifications();
      if (notifRes.data.success) {
        setNotifications(notifRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Could not sync donor dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  // Listen to Socket notifications
  useEffect(() => {
    if (!socket) return;

    socket.on('emergency_request', (data) => {
      // Data contains { request, distance }
      const newReq = { ...data.request, distance: data.distance };
      
      // Play a beep sound
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(600, audioCtx.currentTime); // Beep frequency
        oscillator.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3); // duration
      } catch (e) {
        console.log('Audio feedback not supported or allowed without user interaction');
      }

      setMsg(`🔴 EMERGENCY ALERT: ${newReq.bloodGroup} needed at ${newReq.hospitalName}`);
      setActiveRequests((prev) => {
        // Prevent duplicate entries
        if (prev.some((r) => r._id === newReq._id)) return prev;
        return [newReq, ...prev];
      });
      fetchDonorData();
    });

    socket.on('request_closed', (requestId) => {
      setActiveRequests((prev) => prev.filter((r) => r._id !== requestId));
      setMsg('An emergency request was closed or claimed by another donor.');
      fetchDonorData();
    });

    socket.on('donation_completed', (requestId) => {
      setActiveRequests((prev) => prev.filter((r) => r._id !== requestId));
      setMsg('Thank you! Your donation was completed and recorded.');
      fetchDonorData();
    });

    return () => {
      socket.off('emergency_request');
      socket.off('request_closed');
      socket.off('donation_completed');
    };
  }, [socket]);

  const handleToggleAvailability = async () => {
    try {
      const res = await donorAPI.toggleAvailability();
      if (res.data.success) {
        await updateProfile({ availabilityStatus: res.data.availabilityStatus });
        setMsg(`Availability updated: ${res.data.availabilityStatus ? 'Available' : 'Unavailable'}`);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to update availability status.');
    }
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setUpdatingLocation(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await donorAPI.updateLocation(pos.coords.latitude, pos.coords.longitude);
          if (res.data.success) {
            setMsg('GPS Coordinates updated successfully!');
          }
        } catch (err) {
          console.error(err);
          setError('Failed to sync location coordinates with server.');
        } finally {
          setUpdatingLocation(false);
        }
      },
      (err) => {
        console.error(err);
        setError('Location access denied. Check browser permission.');
        setUpdatingLocation(false);
      }
    );
  };

  const handleAcceptRequest = async (id) => {
    if (!window.confirm('Do you confirm that you will arrive at the hospital to donate blood?')) {
      return;
    }
    try {
      const res = await requestAPI.acceptRequest(id);
      if (res.data.success) {
        setMsg('Request accepted! Please navigate to the hospital location.');
        fetchDonorData();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleRejectRequest = async (id) => {
    try {
      const res = await requestAPI.rejectRequest(id);
      if (res.data.success) {
        setActiveRequests((prev) => prev.filter((r) => r._id !== id));
        setMsg('Request hidden.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to reject request');
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await donorAPI.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Find the first accepted request to show on the LeafletMap
  const acceptedRequest = activeRequests.find(
    (r) => r.status === 'accepted' && r.assignedDonor?._id === user.id
  );

  const pendingRequest = activeRequests.find((r) => r.status === 'pending');
  const activeFocus = acceptedRequest || pendingRequest;

  // Set up Map Markers and route coordinates
  const markers = [];
  let routeCoords = null;

  if (user && user.location && user.location.coordinates) {
    markers.push({
      position: [user.location.coordinates[1], user.location.coordinates[0]],
      type: 'donor',
      popup: { title: 'My Location (Donor)', description: 'Availability: Available' },
    });
  }

  if (activeFocus && activeFocus.location && activeFocus.location.coordinates) {
    markers.push({
      position: [activeFocus.location.coordinates[1], activeFocus.location.coordinates[0]],
      type: 'request',
      popup: {
        title: `Emergency request for ${activeFocus.bloodGroup}`,
        description: `Patient: ${activeFocus.patientName} at ${activeFocus.hospitalName}`,
      },
    });

    if (user && user.location && user.location.coordinates) {
      routeCoords = [
        [user.location.coordinates[1], user.location.coordinates[0]],
        [activeFocus.location.coordinates[1], activeFocus.location.coordinates[0]],
      ];
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Alerts */}
        {msg && (
          <div className="mb-6 rounded-lg bg-primary-50 p-4 text-sm font-bold text-primary-600 border border-primary-100 flex justify-between items-center animate-pulse">
            <span>{msg}</span>
            <button onClick={() => setMsg('')} className="font-bold text-lg hover:text-primary-800">×</button>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Donor Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Hello, {user?.name}. Manage availability and accept requests.</p>
          </div>

          <div className="flex items-center mt-4 md:mt-0 gap-4">
            <button
              onClick={handleUpdateLocation}
              disabled={updatingLocation}
              className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-100 disabled:opacity-50 transition-colors"
            >
              📍 {updatingLocation ? 'Updating GPS...' : 'Update Live GPS'}
            </button>
            <button
              onClick={handleToggleAvailability}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition-colors ${
                user?.availabilityStatus
                  ? 'bg-green-50 text-green-600 hover:bg-green-100'
                  : 'bg-gray-150 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {user?.availabilityStatus ? (
                <>
                  <FaToggleOn className="h-4 w-4" /> Available
                </>
              ) : (
                <>
                  <FaToggleOff className="h-4 w-4" /> Off Duty
                </>
              )}
            </button>
            <button
              onClick={() => {
                logout();
                navigate('/login');
              }}
              className="rounded-full bg-red-50 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map & Active Requests (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Map Frame */}
            <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm h-96">
              <LeafletMap
                center={
                  activeFocus
                    ? [activeFocus.location.coordinates[1], activeFocus.location.coordinates[0]]
                    : user?.location?.coordinates
                    ? [user.location.coordinates[1], user.location.coordinates[0]]
                    : undefined
                }
                zoom={12}
                markers={markers}
                routeCoords={routeCoords}
              />
            </div>

            {/* Emergency Requests queue */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Nearby Emergency Requests</h2>
              {activeRequests.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-medium">
                  No active emergency requests matching your blood type.
                </div>
              ) : (
                <div className="space-y-4">
                  {activeRequests.map((req) => (
                    <div
                      key={req._id}
                      className={`p-4 border rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
                        req.status === 'accepted' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/20'
                      }`}
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-block bg-primary-500 text-white font-extrabold px-2.5 py-0.5 rounded text-sm">
                            {req.bloodGroup}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                              req.emergencyLevel === 'critical'
                                ? 'bg-red-200 text-red-800'
                                : req.emergencyLevel === 'high'
                                ? 'bg-orange-200 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {req.emergencyLevel}
                          </span>
                          {req.status === 'accepted' && (
                            <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs font-bold">
                              Accepted by You
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 text-md font-bold text-gray-900">{req.hospitalName}</h3>
                        <p className="text-xs text-gray-500">Patient: {req.patientName}</p>
                        <p className="text-xs text-gray-400 mt-1">Reason: {req.reason || 'Not specified'}</p>
                        {req.distance !== undefined && (
                          <p className="text-xs text-primary-600 font-bold mt-1">📍 Distance: {req.distance} km away</p>
                        )}
                        {req.status === 'accepted' && (
                          <div className="mt-2 bg-white p-2 rounded border text-xs text-gray-600">
                            <strong>Contact Requester:</strong> {req.phone}
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 w-full md:w-auto">
                        {req.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAcceptRequest(req._id)}
                              className="flex-1 md:flex-none rounded-lg bg-green-500 px-4 py-2 text-xs font-bold text-white hover:bg-green-600"
                            >
                              Accept Request
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req._id)}
                              className="flex-1 md:flex-none rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === 'accepted' && (
                          <span className="text-xs font-semibold text-green-600 flex items-center">
                            <FaCheckCircle className="mr-1" /> Confirmed
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Donor Profile Details & History */}
          <div className="space-y-8">
            {/* Quick Profile Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Donor Metrics</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-red-50 text-red-500 rounded-lg">
                    <FaHeartbeat />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Blood Group</p>
                    <p className="font-bold text-gray-900">{user?.bloodGroup}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                    <FaMapMarkerAlt />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">City / Region</p>
                    <p className="font-bold text-gray-900">{user?.city}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <div className="p-2 bg-yellow-50 text-yellow-600 rounded-lg">
                    <FaCalendarCheck />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Last Donation Date</p>
                    <p className="font-bold text-gray-900">
                      {user?.lastDonationDate ? new Date(user.lastDonationDate).toLocaleDateString() : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Donation History */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">Donation History</h3>
              {history.length === 0 ? (
                <p className="text-center py-6 text-xs text-gray-400 italic">No donations completed yet.</p>
              ) : (
                <div className="space-y-3">
                  {history.map((h) => (
                    <div key={h._id} className="p-3 border rounded-lg bg-gray-50 text-xs">
                      <div className="flex justify-between font-bold text-gray-700">
                        <span>{h.bloodRequest?.hospitalName}</span>
                        <span className="text-green-600">+{h.units} Units</span>
                      </div>
                      <p className="text-gray-400 mt-1">Date: {new Date(h.donationDate).toLocaleDateString()}</p>
                      <p className="text-gray-500">Patient: {h.bloodRequest?.patientName}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications Drawer */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4">
                <FaBell className="inline mr-1 text-primary-500 animate-swing" /> In-App Alerts
              </h3>
              <div className="space-y-3 max-h-56 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-center py-6 text-xs text-gray-400 italic">No alerts.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      onClick={() => handleMarkRead(n._id)}
                      className={`p-3 border rounded-lg text-xs cursor-pointer hover:bg-gray-50 transition-colors ${
                        n.isRead ? 'bg-gray-50/50 border-gray-100 text-gray-400' : 'bg-primary-50/10 border-primary-100 font-semibold'
                      }`}
                    >
                      <p>{n.message}</p>
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

export default DonorDashboard;
