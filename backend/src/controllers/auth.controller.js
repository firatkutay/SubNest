/**
 * Authentication controller for Subnest backend
 * 
 * This file contains all the controller functions for authentication
 * including registration, login, password reset, etc.
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { db } = require('../config/database');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

/**
 * Register a new user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const register = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone_number } = req.body;

    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        code: 409,
        message: 'Email already registered',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate verification token
    const verificationToken = uuidv4();

    // Create user
    const userId = uuidv4();
    await db('users').insert({
      id: userId,
      email,
      password_hash: hashedPassword,
      first_name,
      last_name,
      phone_number,
      verification_token: verificationToken,
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Send verification email
    await emailService.sendVerificationEmail(email, verificationToken);

    // Return success response
    res.status(201).json({
      status: 'success',
      message: 'User registered successfully',
      data: {
        user_id: userId,
        email,
        verification_required: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email address
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    // Find user with verification token
    const user = await db('users').where({ verification_token: token }).first();
    if (!user) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Invalid verification token',
      });
    }

    // Update user
    await db('users')
      .where({ id: user.id })
      .update({
        is_verified: true,
        verification_token: null,
        updated_at: new Date(),
      });

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid credentials',
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Account is inactive',
      });
    }

    // Check if email is verified
    if (!user.is_verified) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Email not verified',
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login
    await db('users')
      .where({ id: user.id })
      .update({
        last_login: new Date(),
      });

    // Return success response
    res.status(200).json({
      status: 'success',
      data: {
        token,
        refresh_token: refreshToken,
        expires_in: 3600,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Refresh token
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const refreshToken = async (req, res, next) => {
  try {
    const { refresh_token } = req.body;

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

    // Find user
    const user = await db('users')
      .where({ id: decoded.id, is_active: true })
      .first();
    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid refresh token',
      });
    }

    // Generate new JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate new refresh token
    const newRefreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    res.status(200).json({
      status: 'success',
      data: {
        token,
        refresh_token: newRefreshToken,
        expires_in: 3600,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Invalid refresh token',
      });
    }
    next(error);
  }
};

/**
 * Forgot password
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await db('users').where({ email }).first();
    if (!user) {
      // Don't reveal that email doesn't exist
      return res.status(200).json({
        status: 'success',
        message: 'Password reset email sent',
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const resetTokenExpires = new Date();
    resetTokenExpires.setHours(resetTokenExpires.getHours() + 1); // Token expires in 1 hour

    // Update user
    await db('users')
      .where({ id: user.id })
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
        updated_at: new Date(),
      });

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, resetToken);

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset password
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Find user with reset token
    const user = await db('users')
      .where({ reset_token: token })
      .where('reset_token_expires', '>', new Date())
      .first();
    if (!user) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user
    await db('users')
      .where({ id: user.id })
      .update({
        password_hash: hashedPassword,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date(),
      });

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const logout = async (req, res, next) => {
  try {
    // In a stateless JWT authentication system, the client is responsible for
    // discarding the token. Server-side we could implement a token blacklist
    // using Redis, but for simplicity we'll just return a success response.

    res.status(200).json({
      status: 'success',
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
};
