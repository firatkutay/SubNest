/**
 * Authentication context for Subnest mobile app
 * 
 * This file provides authentication state management and related functions
 * for the entire mobile application.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { setAuthToken, removeAuthToken } from '../utils/authToken';

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize auth state on app load
  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // Set token in axios headers
        setAuthToken(token);
        
        // Get user profile
        const response = await api.get('/users/profile');
        setUser(response.data.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth initialization error:', error);
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('refreshToken');
        removeAuthToken();
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, []);

  // Login function
  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/login', { email, password });
      const { token, refresh_token, user } = response.data.data;
      
      // Store tokens
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      
      // Set token in axios headers
      setAuthToken(token);
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/register', userData);
      
      return { success: true, data: response.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Registration failed');
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state regardless of API response
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      removeAuthToken();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  // Verify email function
  const verifyEmail = async (token) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/verify-email', { token });
      
      return { success: true, data: response.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Email verification failed');
      return { success: false, error: error.response?.data?.message || 'Email verification failed' };
    } finally {
      setLoading(false);
    }
  };

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/forgot-password', { email });
      
      return { success: true, data: response.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Password reset request failed');
      return { success: false, error: error.response?.data?.message || 'Password reset request failed' };
    } finally {
      setLoading(false);
    }
  };

  // Reset password function
  const resetPassword = async (token, password) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/auth/reset-password', { token, password });
      
      return { success: true, data: response.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Password reset failed');
      return { success: false, error: error.response?.data?.message || 'Password reset failed' };
    } finally {
      setLoading(false);
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.post('/users/change-password', { 
        current_password: currentPassword, 
        new_password: newPassword 
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Password change failed');
      return { success: false, error: error.response?.data?.message || 'Password change failed' };
    } finally {
      setLoading(false);
    }
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      setError(null);
      setLoading(true);
      
      const response = await api.put('/users/profile', profileData);
      
      // Update user state with new profile data
      setUser({
        ...user,
        ...response.data.data
      });
      
      return { success: true, data: response.data };
    } catch (error) {
      setError(error.response?.data?.message || 'Profile update failed');
      return { success: false, error: error.response?.data?.message || 'Profile update failed' };
    } finally {
      setLoading(false);
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const refreshTokenValue = await AsyncStorage.getItem('refreshToken');
      
      if (!refreshTokenValue) {
        throw new Error('No refresh token available');
      }
      
      const response = await api.post('/auth/refresh-token', { 
        refresh_token: refreshTokenValue 
      });
      
      const { token, refresh_token } = response.data.data;
      
      // Store new tokens
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('refreshToken', refresh_token);
      
      // Set token in axios headers
      setAuthToken(token);
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Clear auth state on refresh failure
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      removeAuthToken();
      setUser(null);
      setIsAuthenticated(false);
      
      return false;
    }
  };

  // Context value
  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    verifyEmail,
    forgotPassword,
    resetPassword,
    changePassword,
    updateProfile,
    refreshToken
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
