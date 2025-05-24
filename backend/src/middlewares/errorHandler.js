/**
 * Error handler middleware for Subnest backend
 * 
 * This middleware catches and formats all errors thrown in the application
 * to ensure consistent error responses.
 */

const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error(`${err.name}: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Default error status and message
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 422;
    message = 'Validation error';
    errors = err.errors;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  } else if (err.code === '23505') {
    // PostgreSQL unique violation
    statusCode = 409;
    message = 'Resource already exists';
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message,
    errors,
  });
};

module.exports = errorHandler;
