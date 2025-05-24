/**
 * Subscription controller for Subnest backend
 * 
 * This file contains all the controller functions for subscription management
 * including CRUD operations and statistics.
 */

const { db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all subscriptions for the authenticated user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllSubscriptions = async (req, res, next) => {
  try {
    const { status, category_id, sort_by, sort_order, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = db('subscriptions')
      .select(
        'subscriptions.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color',
        'user_categories.name as user_category_name',
        'user_categories.icon as user_category_icon',
        'user_categories.color as user_category_color'
      )
      .leftJoin('categories', 'subscriptions.category_id', 'categories.id')
      .leftJoin('user_categories', 'subscriptions.user_category_id', 'user_categories.id')
      .where('subscriptions.user_id', req.user.id);
    
    // Apply filters
    if (status) {
      query = query.where('subscriptions.status', status);
    }
    
    if (category_id) {
      query = query.where(function() {
        this.where('subscriptions.category_id', category_id)
            .orWhere('subscriptions.user_category_id', category_id);
      });
    }
    
    // Count total items
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const total = parseInt(count, 10);
    
    // Apply sorting
    if (sort_by && sort_order) {
      query = query.orderBy(`subscriptions.${sort_by}`, sort_order);
    } else {
      query = query.orderBy('subscriptions.next_billing_date', 'asc');
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    // Execute query
    const subscriptions = await query;
    
    // Format response
    const formattedSubscriptions = subscriptions.map(subscription => {
      const category = subscription.category_id ? {
        id: subscription.category_id,
        name: subscription.category_name,
        icon: subscription.category_icon,
        color: subscription.category_color
      } : subscription.user_category_id ? {
        id: subscription.user_category_id,
        name: subscription.user_category_name,
        icon: subscription.user_category_icon,
        color: subscription.user_category_color
      } : null;
      
      return {
        id: subscription.id,
        name: subscription.name,
        description: subscription.description,
        amount: subscription.amount,
        currency: subscription.currency,
        billing_cycle: subscription.billing_cycle,
        category,
        start_date: subscription.start_date,
        next_billing_date: subscription.next_billing_date,
        status: subscription.status,
        auto_renew: subscription.auto_renew,
        reminder_days: subscription.reminder_days,
        payment_method: subscription.payment_method,
        website_url: subscription.website_url,
        created_at: subscription.created_at
      };
    });
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        items: formattedSubscriptions,
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
 * Get subscription by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getSubscriptionById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get subscription
    const subscription = await db('subscriptions')
      .select(
        'subscriptions.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color',
        'user_categories.name as user_category_name',
        'user_categories.icon as user_category_icon',
        'user_categories.color as user_category_color'
      )
      .leftJoin('categories', 'subscriptions.category_id', 'categories.id')
      .leftJoin('user_categories', 'subscriptions.user_category_id', 'user_categories.id')
      .where('subscriptions.id', id)
      .where('subscriptions.user_id', req.user.id)
      .first();
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Subscription not found'
      });
    }
    
    // Get payment history
    const paymentHistory = await db('transactions')
      .select(
        'id',
        'amount',
        'currency',
        'transaction_date',
        'status',
        'payment_method'
      )
      .where('subscription_id', id)
      .orderBy('transaction_date', 'desc');
    
    // Format response
    const category = subscription.category_id ? {
      id: subscription.category_id,
      name: subscription.category_name,
      icon: subscription.category_icon,
      color: subscription.category_color
    } : subscription.user_category_id ? {
      id: subscription.user_category_id,
      name: subscription.user_category_name,
      icon: subscription.user_category_icon,
      color: subscription.user_category_color
    } : null;
    
    const formattedSubscription = {
      id: subscription.id,
      name: subscription.name,
      description: subscription.description,
      amount: subscription.amount,
      currency: subscription.currency,
      billing_cycle: subscription.billing_cycle,
      category,
      start_date: subscription.start_date,
      next_billing_date: subscription.next_billing_date,
      end_date: subscription.end_date,
      status: subscription.status,
      auto_renew: subscription.auto_renew,
      reminder_days: subscription.reminder_days,
      payment_method: subscription.payment_method,
      website_url: subscription.website_url,
      notes: subscription.notes,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      payment_history: paymentHistory
    };
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: formattedSubscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new subscription
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const createSubscription = async (req, res, next) => {
  try {
    const {
      name,
      description,
      amount,
      currency,
      billing_cycle,
      category_id,
      user_category_id,
      start_date,
      auto_renew,
      reminder_days,
      payment_method,
      website_url,
      notes
    } = req.body;
    
    // Calculate next billing date
    const nextBillingDate = calculateNextBillingDate(start_date, billing_cycle);
    
    // Create subscription
    const subscriptionId = uuidv4();
    await db('subscriptions').insert({
      id: subscriptionId,
      user_id: req.user.id,
      name,
      description,
      amount,
      currency: currency || 'TRY',
      billing_cycle,
      category_id,
      user_category_id,
      start_date,
      next_billing_date: nextBillingDate,
      auto_renew: auto_renew !== undefined ? auto_renew : true,
      reminder_days: reminder_days || 3,
      payment_method,
      status: 'active',
      website_url,
      notes,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Get created subscription
    const subscription = await db('subscriptions')
      .where('id', subscriptionId)
      .first();
    
    // Return response
    res.status(201).json({
      status: 'success',
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      amount,
      currency,
      billing_cycle,
      category_id,
      user_category_id,
      next_billing_date,
      auto_renew,
      reminder_days,
      payment_method,
      website_url,
      notes
    } = req.body;
    
    // Check if subscription exists
    const subscription = await db('subscriptions')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Subscription not found'
      });
    }
    
    // Update subscription
    await db('subscriptions')
      .where('id', id)
      .update({
        name,
        description,
        amount,
        currency,
        billing_cycle,
        category_id,
        user_category_id,
        next_billing_date,
        auto_renew,
        reminder_days,
        payment_method,
        website_url,
        notes,
        updated_at: new Date()
      });
    
    // Get updated subscription
    const updatedSubscription = await db('subscriptions')
      .where('id', id)
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Subscription updated successfully',
      data: updatedSubscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update subscription status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateSubscriptionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, end_date } = req.body;
    
    // Check if subscription exists
    const subscription = await db('subscriptions')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Subscription not found'
      });
    }
    
    // Update subscription status
    await db('subscriptions')
      .where('id', id)
      .update({
        status,
        end_date: status === 'cancelled' ? end_date : null,
        updated_at: new Date()
      });
    
    // Get updated subscription
    const updatedSubscription = await db('subscriptions')
      .where('id', id)
      .select('id', 'status', 'end_date', 'updated_at')
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Subscription status updated successfully',
      data: updatedSubscription
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete subscription
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if subscription exists
    const subscription = await db('subscriptions')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!subscription) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Subscription not found'
      });
    }
    
    // Delete subscription
    await db('subscriptions')
      .where('id', id)
      .del();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subscription statistics
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getSubscriptionStatistics = async (req, res, next) => {
  try {
    const { period } = req.query;
    
    // Get all subscriptions
    const subscriptions = await db('subscriptions')
      .where('user_id', req.user.id);
    
    // Calculate statistics
    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;
    const cancelledSubscriptions = subscriptions.filter(s => s.status === 'cancelled').length;
    const pausedSubscriptions = subscriptions.filter(s => s.status === 'paused').length;
    
    // Calculate costs
    const activeSubscriptionsData = subscriptions.filter(s => s.status === 'active');
    const totalMonthlyCost = calculateTotalMonthlyCost(activeSubscriptionsData);
    const totalYearlyCost = totalMonthlyCost * 12;
    
    // Group by category
    const subscriptionsByCategory = await db('subscriptions')
      .select(
        'categories.id',
        'categories.name',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(CASE WHEN subscriptions.billing_cycle = \'monthly\' THEN subscriptions.amount WHEN subscriptions.billing_cycle = \'yearly\' THEN subscriptions.amount / 12 WHEN subscriptions.billing_cycle = \'weekly\' THEN subscriptions.amount * 4.33 WHEN subscriptions.billing_cycle = \'quarterly\' THEN subscriptions.amount / 3 ELSE 0 END) as monthly_cost')
      )
      .leftJoin('categories', 'subscriptions.category_id', 'categories.id')
      .where('subscriptions.user_id', req.user.id)
      .where('subscriptions.status', 'active')
      .groupBy('categories.id', 'categories.name');
    
    // Calculate percentages
    const byCategory = subscriptionsByCategory.map(category => ({
      category: category.name,
      count: parseInt(category.count, 10),
      monthly_cost: parseFloat(category.monthly_cost),
      percentage: totalMonthlyCost > 0 ? (parseFloat(category.monthly_cost) / totalMonthlyCost) * 100 : 0
    }));
    
    // Get upcoming payments
    const upcomingPayments = await db('subscriptions')
      .select('id', 'name', 'amount', 'currency', 'next_billing_date as due_date')
      .where('user_id', req.user.id)
      .where('status', 'active')
      .orderBy('next_billing_date', 'asc')
      .limit(5);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        total_subscriptions: totalSubscriptions,
        active_subscriptions: activeSubscriptions,
        cancelled_subscriptions: cancelledSubscriptions,
        paused_subscriptions: pausedSubscriptions,
        total_monthly_cost: totalMonthlyCost,
        total_yearly_cost: totalYearlyCost,
        currency: 'TRY', // Default currency
        by_category: byCategory,
        upcoming_payments: upcomingPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate next billing date based on start date and billing cycle
 * @param {string} startDate - Start date in YYYY-MM-DD format
 * @param {string} billingCycle - Billing cycle (weekly, monthly, quarterly, yearly)
 * @returns {string} Next billing date in YYYY-MM-DD format
 */
const calculateNextBillingDate = (startDate, billingCycle) => {
  const date = new Date(startDate);
  
  switch (billingCycle) {
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      date.setMonth(date.getMonth() + 1); // Default to monthly
  }
  
  return date.toISOString().split('T')[0];
};

/**
 * Calculate total monthly cost of subscriptions
 * @param {Array} subscriptions - Array of subscription objects
 * @returns {number} Total monthly cost
 */
const calculateTotalMonthlyCost = (subscriptions) => {
  return subscriptions.reduce((total, subscription) => {
    let monthlyCost = 0;
    
    switch (subscription.billing_cycle) {
      case 'weekly':
        monthlyCost = subscription.amount * 4.33; // Average weeks in a month
        break;
      case 'monthly':
        monthlyCost = subscription.amount;
        break;
      case 'quarterly':
        monthlyCost = subscription.amount / 3;
        break;
      case 'yearly':
        monthlyCost = subscription.amount / 12;
        break;
      default:
        monthlyCost = subscription.amount;
    }
    
    return total + monthlyCost;
  }, 0);
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  updateSubscriptionStatus,
  deleteSubscription,
  getSubscriptionStatistics
};
