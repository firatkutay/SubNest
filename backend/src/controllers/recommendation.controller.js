/**
 * Recommendation controller for Subnest backend
 * 
 * This file contains all the controller functions for AI-powered recommendation management
 * including listing, applying, and dismissing recommendations.
 */

const { db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all recommendations for the authenticated user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllRecommendations = async (req, res, next) => {
  try {
    const { type, is_applied, is_dismissed, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = db('recommendations')
      .where('user_id', req.user.id);
    
    // Apply filters
    if (type) {
      query = query.where('type', type);
    }
    
    if (is_applied !== undefined) {
      query = query.where('is_applied', is_applied === 'true');
    }
    
    if (is_dismissed !== undefined) {
      query = query.where('is_dismissed', is_dismissed === 'true');
    }
    
    // Count total items
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const total = parseInt(count, 10);
    
    // Apply sorting and pagination
    query = query.orderBy('created_at', 'desc');
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    // Execute query
    const recommendations = await query;
    
    // Calculate total potential savings
    const savingsQuery = db('recommendations')
      .where('user_id', req.user.id)
      .where('is_dismissed', false)
      .where('is_applied', false)
      .sum('potential_savings as total')
      .first();
    
    const savingsResult = await savingsQuery;
    const totalPotentialSavings = parseFloat(savingsResult.total || 0);
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        items: recommendations,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages
        },
        total_potential_savings: totalPotentialSavings,
        currency: 'TRY' // Default currency
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark recommendation as applied
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const applyRecommendation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if recommendation exists
    const recommendation = await db('recommendations')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!recommendation) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Recommendation not found'
      });
    }
    
    // Mark recommendation as applied
    await db('recommendations')
      .where('id', id)
      .update({
        is_applied: true,
        is_dismissed: false,
        updated_at: new Date()
      });
    
    // Get updated recommendation
    const updatedRecommendation = await db('recommendations')
      .where('id', id)
      .select('id', 'is_applied', 'updated_at')
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Recommendation marked as applied',
      data: updatedRecommendation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark recommendation as dismissed
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const dismissRecommendation = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if recommendation exists
    const recommendation = await db('recommendations')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!recommendation) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Recommendation not found'
      });
    }
    
    // Mark recommendation as dismissed
    await db('recommendations')
      .where('id', id)
      .update({
        is_dismissed: true,
        is_applied: false,
        updated_at: new Date()
      });
    
    // Get updated recommendation
    const updatedRecommendation = await db('recommendations')
      .where('id', id)
      .select('id', 'is_dismissed', 'updated_at')
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Recommendation dismissed',
      data: updatedRecommendation
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate recommendations for users
 * This function is meant to be called by a cron job
 */
const generateRecommendations = async () => {
  try {
    logger.info('Starting recommendation generation');
    
    // Get all active users
    const users = await db('users')
      .where('is_active', true)
      .where('is_verified', true);
    
    for (const user of users) {
      // Generate different types of recommendations
      await generateSubscriptionSharingRecommendations(user.id);
      await generateSwitchPlanRecommendations(user.id);
      await generateCancelUnusedRecommendations(user.id);
      await generateConsolidateServicesRecommendations(user.id);
      await generateBudgetOptimizationRecommendations(user.id);
    }
    
    logger.info('Recommendation generation completed');
  } catch (error) {
    logger.error('Error generating recommendations:', error);
  }
};

/**
 * Generate subscription sharing recommendations
 * @param {string} userId - User ID
 */
const generateSubscriptionSharingRecommendations = async (userId) => {
  try {
    // Get premium streaming subscriptions that can be shared
    const subscriptions = await db('subscriptions')
      .join('categories', 'subscriptions.category_id', 'categories.id')
      .where('subscriptions.user_id', userId)
      .where('subscriptions.status', 'active')
      .where('categories.name', 'Streaming')
      .where('subscriptions.amount', '>', 100) // Premium plans are usually more expensive
      .select('subscriptions.*');
    
    for (const subscription of subscriptions) {
      // Check if recommendation already exists
      const existingRecommendation = await db('recommendations')
        .where('user_id', userId)
        .where('type', 'subscription_sharing')
        .where('related_id', subscription.id)
        .where('is_dismissed', false)
        .first();
      
      if (existingRecommendation) {
        continue;
      }
      
      // Calculate potential savings (assuming 4 people sharing)
      const potentialSavings = parseFloat(subscription.amount) * 0.75; // 75% savings if shared with 3 others
      
      // Create recommendation
      await db('recommendations').insert({
        id: uuidv4(),
        user_id: userId,
        title: `${subscription.name} Aboneliğinizi Paylaşın`,
        description: `${subscription.name} Premium planınızı 4 kişi kullanabilir. Aile üyeleriyle paylaşarak kişi başı maliyeti düşürebilirsiniz.`,
        type: 'subscription_sharing',
        related_id: subscription.id,
        related_type: 'subscription',
        potential_savings: potentialSavings,
        currency: subscription.currency,
        is_applied: false,
        is_dismissed: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (error) {
    logger.error('Error generating subscription sharing recommendations:', error);
  }
};

/**
 * Generate switch plan recommendations
 * @param {string} userId - User ID
 */
const generateSwitchPlanRecommendations = async (userId) => {
  try {
    // Get individual subscriptions that have family plans
    const subscriptions = await db('subscriptions')
      .join('categories', 'subscriptions.category_id', 'categories.id')
      .where('subscriptions.user_id', userId)
      .where('subscriptions.status', 'active')
      .whereIn('categories.name', ['Music', 'Streaming'])
      .where('subscriptions.amount', '<', 100) // Individual plans are usually cheaper
      .select('subscriptions.*', 'categories.name as category_name');
    
    for (const subscription of subscriptions) {
      // Check if recommendation already exists
      const existingRecommendation = await db('recommendations')
        .where('user_id', userId)
        .where('type', 'switch_plan')
        .where('related_id', subscription.id)
        .where('is_dismissed', false)
        .first();
      
      if (existingRecommendation) {
        continue;
      }
      
      // Calculate potential savings (assuming family plan is 1.5x individual but shared with 5 people)
      const familyPlanCost = parseFloat(subscription.amount) * 1.5;
      const individualCostInFamilyPlan = familyPlanCost / 5;
      const potentialSavings = parseFloat(subscription.amount) - individualCostInFamilyPlan;
      
      if (potentialSavings <= 0) {
        continue;
      }
      
      // Create recommendation
      await db('recommendations').insert({
        id: uuidv4(),
        user_id: userId,
        title: `${subscription.name} Bireysel Yerine Aile Planı`,
        description: `${subscription.name} Aile planına geçerek ve 5 kişiyle paylaşarak %60'a varan tasarruf sağlayabilirsiniz.`,
        type: 'switch_plan',
        related_id: subscription.id,
        related_type: 'subscription',
        potential_savings: potentialSavings,
        currency: subscription.currency,
        is_applied: false,
        is_dismissed: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (error) {
    logger.error('Error generating switch plan recommendations:', error);
  }
};

/**
 * Generate cancel unused subscription recommendations
 * @param {string} userId - User ID
 */
const generateCancelUnusedRecommendations = async (userId) => {
  try {
    // Get all active subscriptions
    const subscriptions = await db('subscriptions')
      .where('user_id', userId)
      .where('status', 'active')
      .select('*');
    
    // Get transactions for the last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    for (const subscription of subscriptions) {
      // Check if recommendation already exists
      const existingRecommendation = await db('recommendations')
        .where('user_id', userId)
        .where('type', 'cancel_unused')
        .where('related_id', subscription.id)
        .where('is_dismissed', false)
        .first();
      
      if (existingRecommendation) {
        continue;
      }
      
      // Check if there are any transactions for this subscription in the last 3 months
      const transactions = await db('transactions')
        .where('user_id', userId)
        .where('subscription_id', subscription.id)
        .where('transaction_date', '>=', threeMonthsAgo.toISOString())
        .count('* as count')
        .first();
      
      // If there are transactions, skip this subscription
      if (parseInt(transactions.count, 10) > 0) {
        continue;
      }
      
      // Calculate potential savings (full subscription amount)
      const potentialSavings = parseFloat(subscription.amount);
      
      // Create recommendation
      await db('recommendations').insert({
        id: uuidv4(),
        user_id: userId,
        title: `Kullanılmayan ${subscription.name} Aboneliğini İptal Et`,
        description: `${subscription.name} aboneliğinizi son 3 aydır kullanmadığınızı fark ettik. İptal ederek aylık ${subscription.amount} ${subscription.currency} tasarruf edebilirsiniz.`,
        type: 'cancel_unused',
        related_id: subscription.id,
        related_type: 'subscription',
        potential_savings: potentialSavings,
        currency: subscription.currency,
        is_applied: false,
        is_dismissed: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (error) {
    logger.error('Error generating cancel unused recommendations:', error);
  }
};

/**
 * Generate consolidate services recommendations
 * @param {string} userId - User ID
 */
const generateConsolidateServicesRecommendations = async (userId) => {
  try {
    // Get subscriptions by category
    const subscriptionsByCategory = await db('subscriptions')
      .join('categories', 'subscriptions.category_id', 'categories.id')
      .where('subscriptions.user_id', userId)
      .where('subscriptions.status', 'active')
      .select('subscriptions.*', 'categories.name as category_name')
      .orderBy('categories.name');
    
    // Group subscriptions by category
    const categories = {};
    subscriptionsByCategory.forEach(subscription => {
      if (!categories[subscription.category_name]) {
        categories[subscription.category_name] = [];
      }
      categories[subscription.category_name].push(subscription);
    });
    
    // Check for categories with multiple subscriptions
    for (const [category, subscriptions] of Object.entries(categories)) {
      if (subscriptions.length < 2) {
        continue;
      }
      
      // Check if recommendation already exists
      const existingRecommendation = await db('recommendations')
        .where('user_id', userId)
        .where('type', 'consolidate_services')
        .where('related_type', 'category')
        .where('title', `${category} Servislerinizi Birleştirin`)
        .where('is_dismissed', false)
        .first();
      
      if (existingRecommendation) {
        continue;
      }
      
      // Calculate total cost and potential savings (assuming 30% savings)
      const totalCost = subscriptions.reduce((sum, subscription) => sum + parseFloat(subscription.amount), 0);
      const potentialSavings = totalCost * 0.3;
      
      // Create recommendation
      await db('recommendations').insert({
        id: uuidv4(),
        user_id: userId,
        title: `${category} Servislerinizi Birleştirin`,
        description: `${subscriptions.length} farklı ${category.toLowerCase()} servisine abone olduğunuzu fark ettik. Tek bir premium servise geçerek aylık yaklaşık ${potentialSavings.toFixed(2)} ${subscriptions[0].currency} tasarruf edebilirsiniz.`,
        type: 'consolidate_services',
        related_id: null,
        related_type: 'category',
        potential_savings: potentialSavings,
        currency: subscriptions[0].currency,
        is_applied: false,
        is_dismissed: false,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  } catch (error) {
    logger.error('Error generating consolidate services recommendations:', error);
  }
};

/**
 * Generate budget optimization recommendations
 * @param {string} userId - User ID
 */
const generateBudgetOptimizationRecommendations = async (userId) => {
  try {
    // Get active budgets
    const budgets = await db('budgets')
      .where('user_id', userId)
      .where('is_active', true);
    
    for (const budget of budgets) {
      // Calculate current spending
      const currentSpending = await calculateBudgetSpending(budget);
      const budgetAmount = parseFloat(budget.amount);
      
      // If spending is over 90% of budget, generate recommendation
      if (currentSpending > budgetAmount * 0.9) {
        // Check if recommendation already exists
        const existingRecommendation = await db('recommendations')
          .where('user_id', userId)
          .where('type', 'budget_optimization')
          .where('related_id', budget.id)
          .where('is_dismissed', false)
          .first();
        
        if (existingRecommendation) {
          continue;
        }
        
        // Calculate potential savings (10% of current spending)
        const potentialSavings = currentSpending * 0.1;
        
        // Create recommendation
        await db('recommendations').insert({
          id: uuidv4(),
          user_id: userId,
          title: `${budget.name} Bütçenizi Optimize Edin`,
          description: `${budget.name} bütçenizin %${Math.round((currentSpending / budgetAmount) * 100)}'ini kullandınız. Harcamalarınızı azaltarak aylık yaklaşık ${potentialSavings.toFixed(2)} ${budget.currency} tasarruf edebilirsiniz.`,
          type: 'budget_optimization',
          related_id: budget.id,
          related_type: 'budget',
          potential_savings: potentialSavings,
          currency: budget.currency,
          is_applied: false,
          is_dismissed: false,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    }
  } catch (error) {
    logger.error('Error generating budget optimization recommendations:', error);
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

module.exports = {
  getAllRecommendations,
  applyRecommendation,
  dismissRecommendation,
  generateRecommendations
};
