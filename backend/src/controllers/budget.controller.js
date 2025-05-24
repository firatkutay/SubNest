/**
 * Budget controller for Subnest backend
 * 
 * This file contains all the controller functions for budget management
 * including CRUD operations and statistics.
 */

const { db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all budgets for the authenticated user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllBudgets = async (req, res, next) => {
  try {
    const { period, is_active, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = db('budgets')
      .select(
        'budgets.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color',
        'user_categories.name as user_category_name',
        'user_categories.icon as user_category_icon',
        'user_categories.color as user_category_color'
      )
      .leftJoin('categories', 'budgets.category_id', 'categories.id')
      .leftJoin('user_categories', 'budgets.user_category_id', 'user_categories.id')
      .where('budgets.user_id', req.user.id);
    
    // Apply filters
    if (period) {
      query = query.where('budgets.period', period);
    }
    
    if (is_active !== undefined) {
      query = query.where('budgets.is_active', is_active === 'true');
    }
    
    // Count total items
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const total = parseInt(count, 10);
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    // Execute query
    const budgets = await query;
    
    // Calculate current spending for each budget
    const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
      const category = budget.category_id ? {
        id: budget.category_id,
        name: budget.category_name,
        icon: budget.category_icon,
        color: budget.category_color
      } : budget.user_category_id ? {
        id: budget.user_category_id,
        name: budget.user_category_name,
        icon: budget.user_category_icon,
        color: budget.user_category_color
      } : null;
      
      // Calculate current spending
      const currentSpending = await calculateBudgetSpending(budget);
      const remaining = parseFloat(budget.amount) - currentSpending;
      const percentageUsed = parseFloat(budget.amount) > 0 
        ? (currentSpending / parseFloat(budget.amount)) * 100 
        : 0;
      
      return {
        id: budget.id,
        name: budget.name,
        amount: budget.amount,
        currency: budget.currency,
        period: budget.period,
        start_date: budget.start_date,
        end_date: budget.end_date,
        category,
        is_active: budget.is_active,
        created_at: budget.created_at,
        current_spending: currentSpending,
        remaining,
        percentage_used: percentageUsed
      };
    }));
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        items: budgetsWithSpending,
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
 * Get budget by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getBudgetById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get budget
    const budget = await db('budgets')
      .select(
        'budgets.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color',
        'user_categories.name as user_category_name',
        'user_categories.icon as user_category_icon',
        'user_categories.color as user_category_color'
      )
      .leftJoin('categories', 'budgets.category_id', 'categories.id')
      .leftJoin('user_categories', 'budgets.user_category_id', 'user_categories.id')
      .where('budgets.id', id)
      .where('budgets.user_id', req.user.id)
      .first();
    
    if (!budget) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Budget not found'
      });
    }
    
    // Format response
    const category = budget.category_id ? {
      id: budget.category_id,
      name: budget.category_name,
      icon: budget.category_icon,
      color: budget.category_color
    } : budget.user_category_id ? {
      id: budget.user_category_id,
      name: budget.user_category_name,
      icon: budget.user_category_icon,
      color: budget.user_category_color
    } : null;
    
    // Calculate current spending
    const currentSpending = await calculateBudgetSpending(budget);
    const remaining = parseFloat(budget.amount) - currentSpending;
    const percentageUsed = parseFloat(budget.amount) > 0 
      ? (currentSpending / parseFloat(budget.amount)) * 100 
      : 0;
    
    // Get spending history
    const spendingHistory = await getSpendingHistory(budget);
    
    const formattedBudget = {
      id: budget.id,
      name: budget.name,
      amount: budget.amount,
      currency: budget.currency,
      period: budget.period,
      start_date: budget.start_date,
      end_date: budget.end_date,
      category,
      is_active: budget.is_active,
      created_at: budget.created_at,
      updated_at: budget.updated_at,
      current_spending: currentSpending,
      remaining,
      percentage_used: percentageUsed,
      spending_history: spendingHistory
    };
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: formattedBudget
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new budget
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const createBudget = async (req, res, next) => {
  try {
    const {
      name,
      amount,
      currency,
      period,
      start_date,
      end_date,
      category_id,
      user_category_id,
      is_active
    } = req.body;
    
    // Create budget
    const budgetId = uuidv4();
    await db('budgets').insert({
      id: budgetId,
      user_id: req.user.id,
      name,
      amount,
      currency: currency || 'TRY',
      period,
      start_date,
      end_date,
      category_id,
      user_category_id,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Get created budget
    const budget = await db('budgets')
      .where('id', budgetId)
      .first();
    
    // Return response
    res.status(201).json({
      status: 'success',
      message: 'Budget created successfully',
      data: budget
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update budget
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      amount,
      currency,
      period,
      category_id,
      user_category_id,
      is_active
    } = req.body;
    
    // Check if budget exists
    const budget = await db('budgets')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!budget) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Budget not found'
      });
    }
    
    // Update budget
    await db('budgets')
      .where('id', id)
      .update({
        name,
        amount,
        currency,
        period,
        category_id,
        user_category_id,
        is_active,
        updated_at: new Date()
      });
    
    // Get updated budget
    const updatedBudget = await db('budgets')
      .where('id', id)
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Budget updated successfully',
      data: updatedBudget
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete budget
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteBudget = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if budget exists
    const budget = await db('budgets')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!budget) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Budget not found'
      });
    }
    
    // Delete budget
    await db('budgets')
      .where('id', id)
      .del();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Budget deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get budget statistics
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getBudgetStatistics = async (req, res, next) => {
  try {
    const { period } = req.query;
    
    // Get all active budgets
    const budgets = await db('budgets')
      .select(
        'budgets.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color',
        'user_categories.name as user_category_name',
        'user_categories.icon as user_category_icon',
        'user_categories.color as user_category_color'
      )
      .leftJoin('categories', 'budgets.category_id', 'categories.id')
      .leftJoin('user_categories', 'budgets.user_category_id', 'user_categories.id')
      .where('budgets.user_id', req.user.id)
      .where('budgets.is_active', true);
    
    // Calculate spending for each budget
    const budgetsWithSpending = await Promise.all(budgets.map(async (budget) => {
      const category = budget.category_id ? {
        id: budget.category_id,
        name: budget.category_name,
        icon: budget.category_icon,
        color: budget.category_color
      } : budget.user_category_id ? {
        id: budget.user_category_id,
        name: budget.user_category_name,
        icon: budget.user_category_icon,
        color: budget.user_category_color
      } : null;
      
      // Calculate current spending
      const spending = await calculateBudgetSpending(budget);
      const remaining = parseFloat(budget.amount) - spending;
      const percentageUsed = parseFloat(budget.amount) > 0 
        ? (spending / parseFloat(budget.amount)) * 100 
        : 0;
      
      return {
        category: category ? category.name : 'Uncategorized',
        budget_amount: parseFloat(budget.amount),
        spending,
        remaining,
        percentage_used: percentageUsed
      };
    }));
    
    // Calculate totals
    const totalBudgets = budgets.length;
    const totalBudgetAmount = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
    const totalSpending = budgetsWithSpending.reduce((sum, budget) => sum + budget.spending, 0);
    const totalRemaining = totalBudgetAmount - totalSpending;
    const totalPercentageUsed = totalBudgetAmount > 0 
      ? (totalSpending / totalBudgetAmount) * 100 
      : 0;
    
    // Get monthly trend
    const monthlyTrend = await getMonthlyTrend(req.user.id);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        total_budgets: totalBudgets,
        total_budget_amount: totalBudgetAmount,
        total_spending: totalSpending,
        remaining: totalRemaining,
        percentage_used: totalPercentageUsed,
        currency: 'TRY', // Default currency
        by_category: budgetsWithSpending,
        monthly_trend: monthlyTrend
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate current spending for a budget
 * @param {Object} budget - Budget object
 * @returns {number} Current spending
 */
const calculateBudgetSpending = async (budget) => {
  try {
    // Define date range based on budget period and start date
    const startDate = new Date(budget.start_date);
    let endDate = budget.end_date ? new Date(budget.end_date) : new Date();
    
    if (!budget.end_date) {
      // If no end date, calculate based on period
      if (budget.period === 'monthly') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (budget.period === 'quarterly') {
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (budget.period === 'yearly') {
        endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);
      }
      
      // If calculated end date is in the future, use current date
      if (endDate > new Date()) {
        endDate = new Date();
      }
    }
    
    // Format dates for SQL query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Build query to get spending
    let query;
    
    if (budget.category_id) {
      // Category budget - get subscriptions and bills in this category
      const subscriptionSpending = await db('subscriptions')
        .where('user_id', budget.user_id)
        .where('category_id', budget.category_id)
        .where('status', 'active')
        .where('start_date', '<=', endDateStr)
        .sum('amount as total')
        .first();
      
      const billSpending = await db('bills')
        .where('user_id', budget.user_id)
        .where('category_id', budget.category_id)
        .where('payment_status', 'paid')
        .whereBetween('due_date', [startDateStr, endDateStr])
        .sum('amount as total')
        .first();
      
      return parseFloat(subscriptionSpending.total || 0) + parseFloat(billSpending.total || 0);
    } else if (budget.user_category_id) {
      // User category budget - get subscriptions and bills in this category
      const subscriptionSpending = await db('subscriptions')
        .where('user_id', budget.user_id)
        .where('user_category_id', budget.user_category_id)
        .where('status', 'active')
        .where('start_date', '<=', endDateStr)
        .sum('amount as total')
        .first();
      
      const billSpending = await db('bills')
        .where('user_id', budget.user_id)
        .where('user_category_id', budget.user_category_id)
        .where('payment_status', 'paid')
        .whereBetween('due_date', [startDateStr, endDateStr])
        .sum('amount as total')
        .first();
      
      return parseFloat(subscriptionSpending.total || 0) + parseFloat(billSpending.total || 0);
    } else {
      // Overall budget - get all subscriptions and bills
      const subscriptionSpending = await db('subscriptions')
        .where('user_id', budget.user_id)
        .where('status', 'active')
        .where('start_date', '<=', endDateStr)
        .sum('amount as total')
        .first();
      
      const billSpending = await db('bills')
        .where('user_id', budget.user_id)
        .where('payment_status', 'paid')
        .whereBetween('due_date', [startDateStr, endDateStr])
        .sum('amount as total')
        .first();
      
      return parseFloat(subscriptionSpending.total || 0) + parseFloat(billSpending.total || 0);
    }
  } catch (error) {
    logger.error('Error calculating budget spending:', error);
    return 0;
  }
};

/**
 * Get spending history for a budget
 * @param {Object} budget - Budget object
 * @returns {Array} Spending history
 */
const getSpendingHistory = async (budget) => {
  try {
    // Define date range based on budget period and start date
    const startDate = new Date(budget.start_date);
    let endDate = budget.end_date ? new Date(budget.end_date) : new Date();
    
    // Format dates for SQL query
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    // Get transactions related to this budget's category
    let transactions = [];
    
    if (budget.category_id) {
      // Get transactions for subscriptions in this category
      const subscriptionIds = await db('subscriptions')
        .select('id')
        .where('user_id', budget.user_id)
        .where('category_id', budget.category_id);
      
      const subscriptionTransactions = await db('transactions')
        .select(
          'transactions.transaction_date as date',
          'transactions.amount',
          'subscriptions.name as description'
        )
        .join('subscriptions', 'transactions.subscription_id', 'subscriptions.id')
        .where('transactions.user_id', budget.user_id)
        .whereIn('transactions.subscription_id', subscriptionIds.map(s => s.id))
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr]);
      
      // Get transactions for bills in this category
      const billIds = await db('bills')
        .select('id')
        .where('user_id', budget.user_id)
        .where('category_id', budget.category_id);
      
      const billTransactions = await db('transactions')
        .select(
          'transactions.transaction_date as date',
          'transactions.amount',
          'bills.name as description'
        )
        .join('bills', 'transactions.bill_id', 'bills.id')
        .where('transactions.user_id', budget.user_id)
        .whereIn('transactions.bill_id', billIds.map(b => b.id))
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr]);
      
      transactions = [...subscriptionTransactions, ...billTransactions];
    } else if (budget.user_category_id) {
      // Get transactions for subscriptions in this user category
      const subscriptionIds = await db('subscriptions')
        .select('id')
        .where('user_id', budget.user_id)
        .where('user_category_id', budget.user_category_id);
      
      const subscriptionTransactions = await db('transactions')
        .select(
          'transactions.transaction_date as date',
          'transactions.amount',
          'subscriptions.name as description'
        )
        .join('subscriptions', 'transactions.subscription_id', 'subscriptions.id')
        .where('transactions.user_id', budget.user_id)
        .whereIn('transactions.subscription_id', subscriptionIds.map(s => s.id))
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr]);
      
      // Get transactions for bills in this user category
      const billIds = await db('bills')
        .select('id')
        .where('user_id', budget.user_id)
        .where('user_category_id', budget.user_category_id);
      
      const billTransactions = await db('transactions')
        .select(
          'transactions.transaction_date as date',
          'transactions.amount',
          'bills.name as description'
        )
        .join('bills', 'transactions.bill_id', 'bills.id')
        .where('transactions.user_id', budget.user_id)
        .whereIn('transactions.bill_id', billIds.map(b => b.id))
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr]);
      
      transactions = [...subscriptionTransactions, ...billTransactions];
    } else {
      // Get all transactions
      const subscriptionTransactions = await db('transactions')
        .select(
          'transactions.transaction_date as date',
          'transactions.amount',
          'subscriptions.name as description'
        )
        .join('subscriptions', 'transactions.subscription_id', 'subscriptions.id')
        .where('transactions.user_id', budget.user_id)
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr]);
      
      const billTransactions = await db('transactions')
        .select(
          'transactions.transaction_date as date',
          'transactions.amount',
          'bills.name as description'
        )
        .join('bills', 'transactions.bill_id', 'bills.id')
        .where('transactions.user_id', budget.user_id)
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr]);
      
      transactions = [...subscriptionTransactions, ...billTransactions];
    }
    
    // Sort transactions by date
    return transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  } catch (error) {
    logger.error('Error getting spending history:', error);
    return [];
  }
};

/**
 * Get monthly trend for budgets
 * @param {string} userId - User ID
 * @returns {Array} Monthly trend
 */
const getMonthlyTrend = async (userId) => {
  try {
    // Get last 3 months
    const months = [];
    const now = new Date();
    
    for (let i = 2; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = month.toISOString().split('T')[0].substring(0, 7); // YYYY-MM
      months.push(monthStr);
    }
    
    // Get budget and spending data for each month
    const trend = await Promise.all(months.map(async (month) => {
      const startDate = new Date(`${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(endDate.getDate() - 1);
      
      // Format dates for SQL query
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get budgets for this month
      const budgets = await db('budgets')
        .where('user_id', userId)
        .where('is_active', true)
        .where('start_date', '<=', endDateStr)
        .where(function() {
          this.where('end_date', '>=', startDateStr)
              .orWhereNull('end_date');
        });
      
      // Calculate total budget amount
      const budgetAmount = budgets.reduce((sum, budget) => sum + parseFloat(budget.amount), 0);
      
      // Get spending for this month
      const subscriptionSpending = await db('transactions')
        .join('subscriptions', 'transactions.subscription_id', 'subscriptions.id')
        .where('transactions.user_id', userId)
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr])
        .sum('transactions.amount as total')
        .first();
      
      const billSpending = await db('transactions')
        .join('bills', 'transactions.bill_id', 'bills.id')
        .where('transactions.user_id', userId)
        .whereBetween('transactions.transaction_date', [startDateStr, endDateStr])
        .sum('transactions.amount as total')
        .first();
      
      const spending = parseFloat(subscriptionSpending.total || 0) + parseFloat(billSpending.total || 0);
      
      // Calculate percentage used
      const percentageUsed = budgetAmount > 0 ? (spending / budgetAmount) * 100 : 0;
      
      return {
        month,
        budget_amount: budgetAmount,
        spending,
        percentage_used: percentageUsed
      };
    }));
    
    return trend;
  } catch (error) {
    logger.error('Error getting monthly trend:', error);
    return [];
  }
};

module.exports = {
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetStatistics
};
