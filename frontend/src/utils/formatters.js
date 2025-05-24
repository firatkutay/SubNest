/**
 * Utility functions for formatting values in Subnest frontend
 * 
 * This file provides helper functions for formatting currency,
 * dates, and other values consistently across the application.
 */

import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

/**
 * Format a number as currency
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency code (e.g., 'TRY', 'USD')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount, currency = 'TRY') => {
  if (amount === null || amount === undefined) {
    return '-';
  }
  
  const formatter = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

/**
 * Format a date in the standard application format
 * @param {Date|string} date - Date to format
 * @param {string} formatStr - Format string (default: 'PPP')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'PPP') => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, formatStr, { locale: tr });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
};

/**
 * Format a date as relative time (e.g., "2 days ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true, locale: tr });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '-';
  }
};

/**
 * Format a percentage value
 * @param {number} value - Percentage value (0-100)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) {
    return '-';
  }
  
  return `%${value.toFixed(decimals)}`;
};

/**
 * Format a file size in bytes to human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '-';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format a phone number in Turkish format
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} Formatted phone number
 */
export const formatPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '-';
  
  // Remove non-numeric characters
  const cleaned = phoneNumber.replace(/\D/g, '');
  
  // Check if it's a valid Turkish phone number
  if (cleaned.length !== 10 && cleaned.length !== 11) {
    return phoneNumber;
  }
  
  // Format as (5XX) XXX XX XX or 0 (5XX) XXX XX XX
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
  } else {
    return `0 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)} ${cleaned.substring(7, 9)} ${cleaned.substring(9, 11)}`;
  }
};
