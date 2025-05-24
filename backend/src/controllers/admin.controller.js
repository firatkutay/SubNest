/**
 * Admin controller for Subnest backend
 * 
 * This file contains all the controller functions for admin panel
 * including user management, statistics, and system settings.
 */

const { db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * Get all users (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, status, sort_by, sort_order, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = db('users')
      .select(
        'users.id',
        'users.email',
        'users.first_name',
        'users.last_name',
        'users.phone_number',
        'users.is_active',
        'users.is_verified',
        'users.created_at',
        'users.last_login'
      );
    
    // Apply filters
    if (search) {
      query = query.where(function() {
        this.where('users.email', 'like', `%${search}%`)
            .orWhere('users.first_name', 'like', `%${search}%`)
            .orWhere('users.last_name', 'like', `%${search}%`)
            .orWhere('users.phone_number', 'like', `%${search}%`);
      });
    }
    
    if (status) {
      query = query.where('users.is_active', status === 'active');
    }
    
    // Count total items
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const total = parseInt(count, 10);
    
    // Apply sorting
    if (sort_by && sort_order) {
      query = query.orderBy(`users.${sort_by}`, sort_order);
    } else {
      query = query.orderBy('users.created_at', 'desc');
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    // Execute query
    const users = await query;
    
    // Get user roles
    const userIds = users.map(user => user.id);
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .whereIn('user_roles.user_id', userIds)
      .select('user_roles.user_id', 'roles.name as role_name');
    
    // Map roles to users
    const usersWithRoles = users.map(user => {
      const roles = userRoles
        .filter(ur => ur.user_id === user.id)
        .map(ur => ur.role_name);
      
      return {
        ...user,
        roles
      };
    });
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        items: usersWithRoles,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user details (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getUserDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get user
    const user = await db('users')
      .where('id', id)
      .select(
        'id',
        'email',
        'first_name',
        'last_name',
        'phone_number',
        'is_active',
        'is_verified',
        'created_at',
        'last_login'
      )
      .first();
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found'
      });
    }
    
    // Get user roles
    const userRoles = await db('user_roles')
      .join('roles', 'user_roles.role_id', 'roles.id')
      .where('user_roles.user_id', id)
      .select('roles.id', 'roles.name');
    
    // Get user profile
    const profile = await db('user_profiles')
      .where('user_id', id)
      .first();
    
    // Get user statistics
    const subscriptionCount = await db('subscriptions')
      .where('user_id', id)
      .count('* as count')
      .first();
    
    const billCount = await db('bills')
      .where('user_id', id)
      .count('* as count')
      .first();
    
    const budgetCount = await db('budgets')
      .where('user_id', id)
      .count('* as count')
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        ...user,
        roles: userRoles,
        profile: profile || null,
        statistics: {
          subscription_count: parseInt(subscriptionCount.count, 10),
          bill_count: parseInt(billCount.count, 10),
          budget_count: parseInt(budgetCount.count, 10)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const createUser = async (req, res, next) => {
  try {
    const { email, password, first_name, last_name, phone_number, is_active, is_verified, roles } = req.body;
    
    // Check if user already exists
    const existingUser = await db('users').where({ email }).first();
    if (existingUser) {
      return res.status(409).json({
        status: 'error',
        code: 409,
        message: 'Email already registered'
      });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Create user
      const userId = uuidv4();
      await trx('users').insert({
        id: userId,
        email,
        password_hash: hashedPassword,
        first_name,
        last_name,
        phone_number,
        is_active: is_active !== undefined ? is_active : true,
        is_verified: is_verified !== undefined ? is_verified : true,
        created_at: new Date(),
        updated_at: new Date()
      });
      
      // Assign roles if provided
      if (roles && roles.length > 0) {
        // Get role IDs
        const roleRecords = await trx('roles')
          .whereIn('name', roles)
          .select('id');
        
        // Insert user roles
        const userRoles = roleRecords.map(role => ({
          id: uuidv4(),
          user_id: userId,
          role_id: role.id,
          created_at: new Date()
        }));
        
        if (userRoles.length > 0) {
          await trx('user_roles').insert(userRoles);
        }
      }
    });
    
    // Return success response
    res.status(201).json({
      status: 'success',
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, phone_number, is_active, is_verified, roles } = req.body;
    
    // Check if user exists
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found'
      });
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Update user
      await trx('users')
        .where({ id })
        .update({
          first_name,
          last_name,
          phone_number,
          is_active,
          is_verified,
          updated_at: new Date()
        });
      
      // Update roles if provided
      if (roles) {
        // Delete existing roles
        await trx('user_roles').where({ user_id: id }).del();
        
        // Get role IDs
        const roleRecords = await trx('roles')
          .whereIn('name', roles)
          .select('id');
        
        // Insert user roles
        const userRoles = roleRecords.map(role => ({
          id: uuidv4(),
          user_id: id,
          role_id: role.id,
          created_at: new Date()
        }));
        
        if (userRoles.length > 0) {
          await trx('user_roles').insert(userRoles);
        }
      }
    });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'User updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reset user password (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = req.body;
    
    // Check if user exists
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found'
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update user password
    await db('users')
      .where({ id })
      .update({
        password_hash: hashedPassword,
        updated_at: new Date()
      });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'User password reset successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if user exists
    const user = await db('users').where({ id }).first();
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found'
      });
    }
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Delete user roles
      await trx('user_roles').where({ user_id: id }).del();
      
      // Delete user profile
      await trx('user_profiles').where({ user_id: id }).del();
      
      // Delete user subscriptions
      await trx('subscriptions').where({ user_id: id }).del();
      
      // Delete user bills
      await trx('bills').where({ user_id: id }).del();
      
      // Delete user budgets
      await trx('budgets').where({ user_id: id }).del();
      
      // Delete user notifications
      await trx('notifications').where({ user_id: id }).del();
      
      // Delete user recommendations
      await trx('recommendations').where({ user_id: id }).del();
      
      // Delete user transactions
      await trx('transactions').where({ user_id: id }).del();
      
      // Delete user
      await trx('users').where({ id }).del();
    });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system statistics (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getSystemStatistics = async (req, res, next) => {
  try {
    // Get user statistics
    const totalUsers = await db('users').count('* as count').first();
    const activeUsers = await db('users').where('is_active', true).count('* as count').first();
    const verifiedUsers = await db('users').where('is_verified', true).count('* as count').first();
    
    // Get subscription statistics
    const totalSubscriptions = await db('subscriptions').count('* as count').first();
    const activeSubscriptions = await db('subscriptions').where('status', 'active').count('* as count').first();
    
    // Get bill statistics
    const totalBills = await db('bills').count('* as count').first();
    const pendingBills = await db('bills').where('payment_status', 'pending').count('* as count').first();
    const paidBills = await db('bills').where('payment_status', 'paid').count('* as count').first();
    
    // Get budget statistics
    const totalBudgets = await db('budgets').count('* as count').first();
    
    // Get notification statistics
    const totalNotifications = await db('notifications').count('* as count').first();
    
    // Get recommendation statistics
    const totalRecommendations = await db('recommendations').count('* as count').first();
    
    // Get transaction statistics
    const totalTransactions = await db('transactions').count('* as count').first();
    
    // Get user registration trend (last 6 months)
    const registrationTrend = await getRegistrationTrend();
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        users: {
          total: parseInt(totalUsers.count, 10),
          active: parseInt(activeUsers.count, 10),
          verified: parseInt(verifiedUsers.count, 10)
        },
        subscriptions: {
          total: parseInt(totalSubscriptions.count, 10),
          active: parseInt(activeSubscriptions.count, 10)
        },
        bills: {
          total: parseInt(totalBills.count, 10),
          pending: parseInt(pendingBills.count, 10),
          paid: parseInt(paidBills.count, 10)
        },
        budgets: {
          total: parseInt(totalBudgets.count, 10)
        },
        notifications: {
          total: parseInt(totalNotifications.count, 10)
        },
        recommendations: {
          total: parseInt(totalRecommendations.count, 10)
        },
        transactions: {
          total: parseInt(totalTransactions.count, 10)
        },
        registration_trend: registrationTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get system settings (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getSystemSettings = async (req, res, next) => {
  try {
    // Get system settings
    const settings = await db('system_settings').select('*');
    
    // Convert to key-value object
    const settingsObject = settings.reduce((obj, setting) => {
      obj[setting.key] = setting.value;
      return obj;
    }, {});
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: settingsObject
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update system settings (admin only)
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateSystemSettings = async (req, res, next) => {
  try {
    const settings = req.body;
    
    // Start transaction
    await db.transaction(async (trx) => {
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        // Check if setting exists
        const existingSetting = await trx('system_settings').where({ key }).first();
        
        if (existingSetting) {
          // Update existing setting
          await trx('system_settings')
            .where({ key })
            .update({
              value: value.toString(),
              updated_at: new Date()
            });
        } else {
          // Create new setting
          await trx('system_settings').insert({
            id: uuidv4(),
            key,
            value: value.toString(),
            created_at: new Date(),
            updated_at: new Date()
          });
        }
      }
    });
    
    // Return success response
    res.status(200).json({
      status: 'success',
      message: 'System settings updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user registration trend (last 6 months)
 * @returns {Array} Registration trend
 */
const getRegistrationTrend = async () => {
  try {
    // Get last 6 months
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      months.push(monthStr);
    }
    
    // Get registration count for each month
    const trend = await Promise.all(months.map(async (month) => {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      
      // Format dates for SQL query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get count
      const { count } = await db('users')
        .whereBetween('created_at', [startDateStr, endDateStr])
        .count('* as count')
        .first();
      
      return {
        month,
        count: parseInt(count, 10)
      };
    }));
    
    return trend;
  } catch (error) {
    logger.error('Error getting registration trend:', error);
    return [];
  }
};

module.exports = {
  getAllUsers,
  getUserDetails,
  createUser,
  updateUser,
  resetUserPassword,
  deleteUser,
  getSystemStatistics,
  getSystemSettings,
  updateSystemSettings
};
