import axios from 'axios';

// Fix: import statements must come before any variable declarations in ESM
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach token if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token expired or invalid, clear auth details
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Do not force reload/redirect here directly — let AuthContext handle it
    }
    return Promise.reject(error);
  }
);

// Auth Service Endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  registerHospital: (hospitalData) => api.post('/auth/register-hospital', hospitalData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.put(`/auth/reset-password/${token}`, { password }),
};

// Requests Service Endpoints
export const requestAPI = {
  createRequest: (requestData) => api.post('/requests', requestData),
  getRequests: () => api.get('/requests'),
  getRequest: (id) => api.get(`/requests/${id}`),
  acceptRequest: (id) => api.put(`/requests/${id}/accept`),
  rejectRequest: (id) => api.put(`/requests/${id}/reject`),
  completeRequest: (id) => api.put(`/requests/${id}/complete`),
  cancelRequest: (id) => api.put(`/requests/${id}/cancel`),
};

// Donors Service Endpoints
export const donorAPI = {
  toggleAvailability: () => api.put('/donors/availability'),
  getDonationHistory: () => api.get('/donors/history'),
  getNotifications: () => api.get('/donors/notifications'),
  markNotificationRead: (id) => api.put(`/donors/notifications/${id}/read`),
  updateLocation: (lat, lng) => api.put('/donors/location', { latitude: lat, longitude: lng }),
};

// Hospitals Service Endpoints
export const hospitalAPI = {
  getDashboard: () => api.get('/hospitals/dashboard'),
  getInventory: () => api.get('/hospitals/inventory'),
  updateInventory: (bloodGroup, quantity) => api.put('/hospitals/inventory', { bloodGroup, quantity }),
  getNearbyDonors: (bloodGroup, maxDistance) =>
    api.get(`/hospitals/donors`, { params: { bloodGroup, maxDistance } }),
};

// Admin Service Endpoints
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (filters) => api.get('/admin/users', { params: filters }),
  verifyHospital: (id, status) => api.put(`/admin/hospitals/${id}/verify`, { status }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getLogs: () => api.get('/admin/logs'),
};

export default api;
