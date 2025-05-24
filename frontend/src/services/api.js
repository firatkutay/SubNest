/**
 * API service for Subnest frontend
 * 
 * This file provides a configured axios instance for making API requests
 * with interceptors for token refresh and error handling.
 */

import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any request modifications here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // If error is 401 (Unauthorized) and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Get refresh token from storage
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          // No refresh token available, redirect to login
          window.location.href = '/login';
          return Promise.reject(error);
        }
        
        // Attempt to refresh token
        const response = await axios.post(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1'}/auth/refresh-token`,
          { refresh_token: refreshToken },
          { skipAuthRefresh: true }
        );
        
        const { token, refresh_token } = response.data.data;
        
        // Store new tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refresh_token);
        
        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
