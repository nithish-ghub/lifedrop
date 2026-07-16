import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user data on startup
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          
          // Verify with server profile to ensure the token is still valid
          const res = await authAPI.getProfile();
          if (res.data.success) {
            setUser(res.data.data);
            localStorage.setItem('user', JSON.stringify(res.data.data));
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data.success) {
        const { token, user: loggedUser } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(loggedUser));
        setUser(loggedUser);
        return { success: true, user: loggedUser };
      }
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const res = await authAPI.register(userData);
      if (res.data.success) {
        const { token, user: registeredUser } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(registeredUser));
        setUser(registeredUser);
        return { success: true, user: registeredUser };
      }
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const registerHospital = async (hospitalData) => {
    setLoading(true);
    try {
      const res = await authAPI.registerHospital(hospitalData);
      return { success: true, message: res.data.message };
    } catch (error) {
      console.error('Hospital registration error:', error);
      const message = error.response?.data?.message || 'Hospital registration failed.';
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await authAPI.updateProfile(profileData);
      if (res.data.success) {
        const updatedUser = res.data.user;
        
        // Fetch full profile info to keep states populated
        const fullProfileRes = await authAPI.getProfile();
        const freshUser = fullProfileRes.data.success ? fullProfileRes.data.data : updatedUser;

        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
        return { success: true };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const message = error.response?.data?.message || 'Failed to update profile.';
      return { success: false, message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        registerHospital,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
