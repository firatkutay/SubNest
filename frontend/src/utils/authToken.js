/**
 * Auth token utility for Subnest frontend
 * 
 * This file provides functions for managing authentication tokens
 * in axios headers and local storage.
 */

import api from '../services/api';

/**
 * Set authentication token in axios headers
 * @param {string} token - JWT token
 */
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

/**
 * Remove authentication token from axios headers
 */
export const removeAuthToken = () => {
  delete api.defaults.headers.common['Authorization'];
};

/**
 * Get authentication token from local storage
 * @returns {string|null} JWT token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if authenticated, false otherwise
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
