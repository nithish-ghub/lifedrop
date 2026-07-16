import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Common/Navbar';
import Footer from '../components/Common/Footer';
import {
  FaUsers,
  FaHospital,
  FaHeartbeat,
  FaCheck,
  FaTimes,
  FaTrashAlt,
  FaChartBar,
  FaHistory,
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [bloodGroups, setBloodGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [tab, setTab] = useState('hospitals'); // 'hospitals', 'users', 'logs', 'analytics'

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch stats
      const statsRes = await adminAPI.getDashboard();
      if (statsRes.data.success) {
        setStats(statsRes.data.data.stats);
        setBloodGroups(statsRes.data.data.bloodGroups || []);
      }

      // Fetch users
      const usersRes = await adminAPI.getUsers();
      if (usersRes.data.success) {
        setUsers(usersRes.data.data);
      }

      // Fetch admin logs
      const logsRes = await adminAPI.getLogs();
      if (logsRes.data.success) {
        setLogs(logsRes.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleVerifyHospital = async (id, status) => {
    try {
      const res = await adminAPI.verifyHospital(id, status);
      if (res.data.success) {
        // Refresh data
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update verification status');
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This will remove all their details permanently.')) {
      return;
    }
    try {
      const res = await adminAPI.deleteUser(id);
      if (res.data.success) {
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const pendingHospitals = users.filter(
    (u) => u.role === 'hospital' && u.verificationStatus === 'pending'
  );

  const filteredUsers = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false;
    return true;
  });

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b pb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Admin Control Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Manage users, approve medical licenses, and view system metrics.</p>
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

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-600 border border-red-100">
            ⚠️ {error}
          </div>
        )}

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
                <FaUsers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stats.totalUsers}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Users</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                <FaHeartbeat className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stats.totalDonors}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Total Donors</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-green-50 text-green-500 rounded-xl">
                <FaHospital className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stats.totalHospitals}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Registered Hospitals</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <FaHeartbeat className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-black text-gray-900">{stats.pendingHospitals}</p>
                <p className="text-xs font-semibold text-gray-500 uppercase">Hospital Requests</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Controls */}
        <div className="flex border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setTab('hospitals')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              tab === 'hospitals' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Hospital Approvals ({pendingHospitals.length})
          </button>
          <button
            onClick={() => setTab('users')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              tab === 'users' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Manage Users
          </button>
          <button
            onClick={() => setTab('analytics')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              tab === 'analytics' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaChartBar className="inline mr-1" /> Analytics
          </button>
          <button
            onClick={() => setTab('logs')}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-colors ${
              tab === 'logs' ? 'border-primary-500 text-primary-500' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaHistory className="inline mr-1" /> Activity Logs
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {/* Tab: Hospitals */}
            {tab === 'hospitals' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Pending Hospital Verifications</h2>
                {pendingHospitals.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium">
                    No hospitals awaiting verification.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Hospital Name</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">License Number</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email / Phone</th>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">City / Address</th>
                          <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {pendingHospitals.map((hosp) => (
                          <tr key={hosp._id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{hosp.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500 font-mono">{hosp.licenseNumber}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div>{hosp.email}</div>
                              <div className="text-xs text-gray-400">{hosp.phone}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              <div>{hosp.city}</div>
                              <div className="text-xs text-gray-400">{hosp.address}</div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center space-x-2">
                                <button
                                  onClick={() => handleVerifyHospital(hosp._id, 'approved')}
                                  className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                                  title="Approve Hospital"
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  onClick={() => handleVerifyHospital(hosp._id, 'rejected')}
                                  className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                  title="Reject License"
                                >
                                  <FaTimes />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Users */}
            {tab === 'users' && (
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <h2 className="text-xl font-bold text-gray-800">User Accounts Management</h2>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="donor">Donors</option>
                    <option value="patient">Patients</option>
                    <option value="hospital">Hospitals</option>
                  </select>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">User Name</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Contact Info</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Blood / Status</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredUsers.map((item) => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-gray-900">{item.name}</div>
                            <div className="text-xs text-gray-400">{item.city}</div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold capitalize text-gray-600">
                            {item.role}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            <div>{item.email}</div>
                            <div className="text-xs text-gray-400">{item.phone}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">
                            {item.role === 'donor' && (
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700">
                                {item.bloodGroup}
                              </span>
                            )}
                            {item.role === 'hospital' && (
                              <span
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  item.verificationStatus === 'approved'
                                    ? 'bg-green-50 text-green-700'
                                    : item.verificationStatus === 'pending'
                                    ? 'bg-yellow-50 text-yellow-700'
                                    : 'bg-red-50 text-red-700'
                                }`}
                              >
                                {item.verificationStatus}
                              </span>
                            )}
                            {item.role === 'patient' && <span className="text-xs text-gray-400">Regular</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {item._id !== user.id ? (
                              <button
                                onClick={() => handleDeleteUser(item._id)}
                                className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                title="Delete User Account"
                              >
                                <FaTrashAlt />
                              </button>
                            ) : (
                              <span className="text-xs text-gray-400">Owner</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Analytics */}
            {tab === 'analytics' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">Database Analytics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Blood Group Bar Chart */}
                  <div className="border rounded-2xl p-6 bg-gray-50">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
                      Donor Blood Group Distribution
                    </h3>
                    <div className="space-y-4">
                      {bloodGroups.length === 0 ? (
                        <div className="text-gray-400 text-sm">No donor blood records.</div>
                      ) : (
                        bloodGroups.map((group) => {
                          const maxCount = Math.max(...bloodGroups.map((g) => g.count));
                          const percent = maxCount > 0 ? (group.count / maxCount) * 100 : 0;
                          return (
                            <div key={group._id} className="space-y-1">
                              <div className="flex justify-between text-xs font-bold text-gray-700">
                                <span>Group {group._id}</span>
                                <span>{group.count} Donors</span>
                              </div>
                              <div className="w-full bg-gray-200 h-3.5 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${percent}%` }}
                                  className="bg-primary-500 h-full rounded-full transition-all duration-500"
                                ></div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="border rounded-2xl p-6 bg-gray-50 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
                        General Analytics Summary
                      </h3>
                      <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex justify-between">
                          <span>Total Registered Donors:</span>
                          <span className="font-bold text-gray-900">{stats?.totalDonors || 0}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Active / Available Donors:</span>
                          <span className="font-bold text-green-600">{stats?.activeDonors || 0}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Total Emergency Requests:</span>
                          <span className="font-bold text-gray-900">{stats?.totalRequests || 0}</span>
                        </li>
                        <li className="flex justify-between">
                          <span>Completed Donations:</span>
                          <span className="font-bold text-primary-500">{stats?.completedDonations || 0}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-8 border-t pt-4 text-xs text-gray-400 italic">
                      Analytics automatically calculate counts from live production collections.
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Logs */}
            {tab === 'logs' && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">Administrative Action Trail</h2>
                {logs.length === 0 ? (
                  <div className="text-center py-10 text-gray-400 font-medium">No actions logged.</div>
                ) : (
                  <div className="overflow-y-auto max-h-96 space-y-3 pr-2">
                    {logs.map((log) => (
                      <div key={log._id} className="p-4 border rounded-xl bg-gray-50 text-xs">
                        <div className="flex justify-between font-bold text-gray-700">
                          <span className="uppercase text-primary-600">{log.action}</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="mt-1 text-gray-600 text-sm leading-relaxed">{log.details}</p>
                        <p className="mt-2 text-[10px] text-gray-400">
                          Performed by: {log.admin?.name} ({log.admin?.email})
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
