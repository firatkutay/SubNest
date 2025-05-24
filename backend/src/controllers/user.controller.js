/**
 * User controller for Subnest backend
 * 
 * This file contains all the controller functions for user management
 * including profile management, notification preferences, etc.
 */

const { db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Get user profile
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getProfile = async (req, res, next) => {
  try {
    // Get user profile from database
    const user = await db('users')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.phone_number',
        'users.created_at',
        'users.last_login'
      )
      .where('users.id', req.user.id)
      .first();

    // Get user profile details
    const profile = await db('user_profiles')
      .select(
        'profile_picture_url',
        'currency',
        'language',
        'timezone',
        'monthly_budget'
      )
      .where('user_id', req.user.id)
      .first();

    // Return user profile
    res.status(200).json({
      status: 'success',
      data: {
        ...user,
        profile: profile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, phone_number, profile } = req.body;

    // Start transaction
    await db.transaction(async (trx) => {
      // Update user
      await trx('users')
        .where('id', req.user.id)
        .update({
          first_name,
          last_name,
          phone_number,
          updated_at: new Date(),
        });

      // Check if profile exists
      const existingProfile = await trx('user_profiles')
        .where('user_id', req.user.id)
        .first();

      if (profile) {
        if (existingProfile) {
          // Update profile
          await trx('user_profiles')
            .where('user_id', req.user.id)
            .update({
              currency: profile.currency,
              language: profile.language,
              timezone: profile.timezone,
              monthly_budget: profile.monthly_budget,
              updated_at: new Date(),
            });
        } else {
          // Create profile
          await trx('user_profiles').insert({
            id: uuidv4(),
            user_id: req.user.id,
            currency: profile.currency,
            language: profile.language,
            timezone: profile.timezone,
            monthly_budget: profile.monthly_budget,
            created_at: new Date(),
            updated_at: new Date(),
          });
        }
      }
    });

    // Get updated user profile
    const updatedUser = await db('users')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.phone_number',
        'users.updated_at'
      )
      .where('users.id', req.user.id)
      .first();

    // Get updated profile details
    const updatedProfile = await db('user_profiles')
      .select(
        'currency',
        'language',
        'timezone',
        'monthly_budget'
      )
      .where('user_id', req.user.id)
      .first();

    // Return updated user profile
    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        ...updatedUser,
        profile: updatedProfile || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload profile picture
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const uploadProfilePicture = async (req, res, next) => {
  try {
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'No file uploaded',
      });
    }

    // Get file path
    const profilePictureUrl = `/uploads/profiles/${req.file.filename}`;

    // Check if profile exists
    const existingProfile = await db('user_profiles')
      .where('user_id', req.user.id)
      .first();

    if (existingProfile) {
      // Update profile
      await db('user_profiles')
        .where('user_id', req.user.id)
        .update({
          profile_picture_url: profilePictureUrl,
          updated_at: new Date(),
        });
    } else {
      // Create profile
      await db('user_profiles').insert({
        id: uuidv4(),
        user_id: req.user.id,
        profile_picture_url: profilePictureUrl,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Profile picture uploaded successfully',
      data: {
        profile_picture_url: profilePictureUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change password
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;

    // Get user from database
    const user = await db('users')
      .where('id', req.user.id)
      .first();

    // Check if current password is correct
    const isMatch = await bcrypt.compare(current_password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(new_password, salt);

    // Update password
    await db('users')
      .where('id', req.user.id)
      .update({
        password_hash: hashedPassword,
        updated_at: new Date(),
      });

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get notification preferences
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getNotificationPreferences = async (req, res, next) => {
  try {
    // Get user from database
    const user = await db('users')
      .where('id', req.user.id)
      .first();

    // Get notification preferences from user preferences
    const preferences = user.preferences || {};
    const notificationPreferences = preferences.notifications || {
      push_enabled: true,
      email_enabled: true,
      sms_enabled: false,
      quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00',
        timezone: 'Europe/Istanbul',
      },
      notification_types: {
        subscription_reminder: {
          push: true,
          email: true,
          sms: false,
          days_before: 3,
        },
        bill_due: {
          push: true,
          email: true,
          sms: false,
          days_before: 3,
        },
        budget_alert: {
          push: true,
          email: false,
          sms: false,
        },
        recommendations: {
          push: true,
          email: true,
          sms: false,
        },
      },
    };

    // Return notification preferences
    res.status(200).json({
      status: 'success',
      data: notificationPreferences,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update notification preferences
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateNotificationPreferences = async (req, res, next) => {
  try {
    // Get user from database
    const user = await db('users')
      .where('id', req.user.id)
      .first();

    // Get current preferences
    const preferences = user.preferences || {};

    // Update notification preferences
    preferences.notifications = req.body;

    // Update user preferences
    await db('users')
      .where('id', req.user.id)
      .update({
        preferences: preferences,
        updated_at: new Date(),
      });

    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'Notification preferences updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  uploadProfilePicture,
  changePassword,
  getNotificationPreferences,
  updateNotificationPreferences,
};
