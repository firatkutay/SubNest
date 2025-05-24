/**
 * Authentication middleware for Subnest backend
 * 
 * This middleware verifies JWT tokens and adds the authenticated user
 * to the request object.
 */

const jwt = require('jsonwebtoken');
const { db } = require('../config/database');

/**
 * Middleware to protect routes that require authentication
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Authentication required. Please login.',
      });
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user exists
    const user = await db('users')
      .where({ id: decoded.id, is_active: true })
      .first();

    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'User not found or inactive.',
      });
    }

    // Add user to request object
    req.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
    };

    // Set current user ID for audit logging
    if (process.env.NODE_ENV === 'production') {
      await db.raw(`SET LOCAL app.current_user_id = '${user.id}'`);
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid token.',
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Token expired.',
      });
    }

    next(error);
  }
};

/**
 * Middleware to check if user has admin role
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const isAdmin = async (req, res, next) => {
  try {
    // Check if user has admin role
    const userRole = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where({ 'user_roles.user_id': req.user.id, 'roles.name': 'admin' })
      .first();

    if (!userRole) {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  authenticate,
  isAdmin,
};
