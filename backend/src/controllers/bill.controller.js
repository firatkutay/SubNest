/**
 * Bill controller for Subnest backend
 * 
 * This file contains all the controller functions for bill management
 * including CRUD operations and statistics.
 */

const { db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all bills for the authenticated user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllBills = async (req, res, next) => {
  try {
    const { 
      status, 
      category_id, 
      start_date, 
      end_date, 
      sort_by, 
      sort_order, 
      page = 1, 
      limit = 20 
    } = req.query;
    
    // Build query
    let query = db('bills')
      .select(
        'bills.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color',
        'user_categories.name as user_category_name',
        'user_categories.icon as user_category_icon',
        'user_categories.color as user_category_color'
      )
      .leftJoin('categories', 'bills.category_id', 'categories.id')
      .leftJoin('user_categories', 'bills.user_category_id', 'user_categories.id')
      .where('bills.user_id', req.user.id);
    
    // Apply filters
    if (status) {
      query = query.where('bills.payment_status', status);
    }
    
    if (category_id) {
      query = query.where(function() {
        this.where('bills.category_id', category_id)
            .orWhere('bills.user_category_id', category_id);
      });
    }
    
    if (start_date) {
      query = query.where('bills.due_date', '>=', start_date);
    }
    
    if (end_date) {
      query = query.where('bills.due_date', '<=', end_date);
    }
    
    // Count total items
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const total = parseInt(count, 10);
    
    // Apply sorting
    if (sort_by && sort_order) {
      query = query.orderBy(`bills.${sort_by}`, sort_order);
    } else {
      query = query.orderBy('bills.due_date', 'asc');
    }
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    // Execute query
    const bills = await query;
    
    // Format response
    const formattedBills = bills.map(bill => {
      const category = bill.category_id ? {
        id: bill.category_id,
        name: bill.category_name,
        icon: bill.category_icon,
        color: bill.category_color
      } : bill.user_category_id ? {
        id: bill.user_category_id,
        name: bill.user_category_name,
        icon: bill.user_category_icon,
        color: bill.user_category_color
      } : null;
      
      return {
        id: bill.id,
        name: bill.name,
        description: bill.description,
        amount: bill.amount,
        currency: bill.currency,
        due_date: bill.due_date,
        category,
        payment_status: bill.payment_status,
        payment_method: bill.payment_method,
        reminder_days: bill.reminder_days,
        recurring: bill.recurring,
        created_at: bill.created_at
      };
    });
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        items: formattedBills,
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
 * Get bill by ID
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getBillById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get bill
    const bill = await db('bills')
      .select(
        'bills.*',
        'categories.name as category_name',
        'categories.icon as category_icon',
        'categories.color as category_color',
        'user_categories.name as user_category_name',
        'user_categories.icon as user_category_icon',
        'user_categories.color as user_category_color'
      )
      .leftJoin('categories', 'bills.category_id', 'categories.id')
      .leftJoin('user_categories', 'bills.user_category_id', 'user_categories.id')
      .where('bills.id', id)
      .where('bills.user_id', req.user.id)
      .first();
    
    if (!bill) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Bill not found'
      });
    }
    
    // Format response
    const category = bill.category_id ? {
      id: bill.category_id,
      name: bill.category_name,
      icon: bill.category_icon,
      color: bill.category_color
    } : bill.user_category_id ? {
      id: bill.user_category_id,
      name: bill.user_category_name,
      icon: bill.user_category_icon,
      color: bill.user_category_color
    } : null;
    
    const formattedBill = {
      id: bill.id,
      name: bill.name,
      description: bill.description,
      amount: bill.amount,
      currency: bill.currency,
      due_date: bill.due_date,
      category,
      payment_status: bill.payment_status,
      payment_date: bill.payment_date,
      payment_method: bill.payment_method,
      reminder_days: bill.reminder_days,
      recurring: bill.recurring,
      recurring_id: bill.recurring_id,
      notes: bill.notes,
      attachment_url: bill.attachment_url,
      created_at: bill.created_at,
      updated_at: bill.updated_at
    };
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: formattedBill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new bill
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const createBill = async (req, res, next) => {
  try {
    const {
      name,
      description,
      amount,
      currency,
      due_date,
      category_id,
      user_category_id,
      payment_status,
      reminder_days,
      recurring,
      recurring_id,
      notes
    } = req.body;
    
    // Create bill
    const billId = uuidv4();
    await db('bills').insert({
      id: billId,
      user_id: req.user.id,
      name,
      description,
      amount,
      currency: currency || 'TRY',
      due_date,
      category_id,
      user_category_id,
      payment_status: payment_status || 'pending',
      reminder_days: reminder_days || 3,
      recurring: recurring || false,
      recurring_id,
      notes,
      created_at: new Date(),
      updated_at: new Date()
    });
    
    // Get created bill
    const bill = await db('bills')
      .where('id', billId)
      .first();
    
    // Return response
    res.status(201).json({
      status: 'success',
      message: 'Bill created successfully',
      data: bill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update bill
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      amount,
      currency,
      due_date,
      category_id,
      user_category_id,
      payment_status,
      reminder_days,
      notes
    } = req.body;
    
    // Check if bill exists
    const bill = await db('bills')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!bill) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Bill not found'
      });
    }
    
    // Update bill
    await db('bills')
      .where('id', id)
      .update({
        name,
        description,
        amount,
        currency,
        due_date,
        category_id,
        user_category_id,
        payment_status,
        reminder_days,
        notes,
        updated_at: new Date()
      });
    
    // Get updated bill
    const updatedBill = await db('bills')
      .where('id', id)
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Bill updated successfully',
      data: updatedBill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update bill payment status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const updateBillPaymentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { payment_status, payment_date, payment_method } = req.body;
    
    // Check if bill exists
    const bill = await db('bills')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!bill) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Bill not found'
      });
    }
    
    // Update bill payment status
    await db('bills')
      .where('id', id)
      .update({
        payment_status,
        payment_date: payment_status === 'paid' ? payment_date || new Date() : null,
        payment_method: payment_status === 'paid' ? payment_method : null,
        updated_at: new Date()
      });
    
    // If bill is paid, create transaction record
    if (payment_status === 'paid' && bill.payment_status !== 'paid') {
      await db('transactions').insert({
        id: uuidv4(),
        user_id: req.user.id,
        bill_id: id,
        amount: bill.amount,
        currency: bill.currency,
        transaction_date: payment_date || new Date(),
        payment_method_id: null, // This would be set if using a saved payment method
        status: 'completed',
        reference_number: `BILL-${id.substring(0, 8)}`,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
    
    // Get updated bill
    const updatedBill = await db('bills')
      .where('id', id)
      .select('id', 'payment_status', 'payment_date', 'payment_method', 'updated_at')
      .first();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Bill payment status updated successfully',
      data: updatedBill
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload bill attachment
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const uploadBillAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if bill exists
    const bill = await db('bills')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!bill) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Bill not found'
      });
    }
    
    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        code: 400,
        message: 'No file uploaded'
      });
    }
    
    // Get file path
    const attachmentUrl = `/uploads/bills/${req.file.filename}`;
    
    // Update bill
    await db('bills')
      .where('id', id)
      .update({
        attachment_url: attachmentUrl,
        updated_at: new Date()
      });
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Bill attachment uploaded successfully',
      data: {
        attachment_url: attachmentUrl
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete bill
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const deleteBill = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if bill exists
    const bill = await db('bills')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!bill) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Bill not found'
      });
    }
    
    // Delete bill
    await db('bills')
      .where('id', id)
      .del();
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Bill deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bill statistics
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getBillStatistics = async (req, res, next) => {
  try {
    const { period, start_date, end_date } = req.query;
    
    // Define date range based on period
    let startDateFilter = start_date;
    let endDateFilter = end_date;
    
    if (!startDateFilter || !endDateFilter) {
      const now = new Date();
      
      if (period === 'monthly') {
        startDateFilter = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        endDateFilter = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      } else if (period === 'yearly') {
        startDateFilter = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        endDateFilter = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
      } else {
        // Default to all time if no period specified
        startDateFilter = null;
        endDateFilter = null;
      }
    }
    
    // Build base query
    let query = db('bills').where('user_id', req.user.id);
    
    // Apply date filters if provided
    if (startDateFilter) {
      query = query.where('due_date', '>=', startDateFilter);
    }
    
    if (endDateFilter) {
      query = query.where('due_date', '<=', endDateFilter);
    }
    
    // Get all bills
    const bills = await query;
    
    // Calculate statistics
    const totalBills = bills.length;
    const pendingBills = bills.filter(b => b.payment_status === 'pending').length;
    const paidBills = bills.filter(b => b.payment_status === 'paid').length;
    const overdueBills = bills.filter(b => b.payment_status === 'overdue').length;
    
    // Calculate amounts
    const totalAmount = bills.reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
    const paidAmount = bills
      .filter(b => b.payment_status === 'paid')
      .reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
    const pendingAmount = bills
      .filter(b => b.payment_status === 'pending' || b.payment_status === 'overdue')
      .reduce((sum, bill) => sum + parseFloat(bill.amount), 0);
    
    // Group by category
    const billsByCategory = await db('bills')
      .select(
        'categories.id',
        'categories.name',
        db.raw('COUNT(*) as count'),
        db.raw('SUM(bills.amount) as total_amount')
      )
      .leftJoin('categories', 'bills.category_id', 'categories.id')
      .where('bills.user_id', req.user.id)
      .groupBy('categories.id', 'categories.name');
    
    // Calculate percentages
    const byCategory = billsByCategory.map(category => ({
      category: category.name || 'Uncategorized',
      count: parseInt(category.count, 10),
      total_amount: parseFloat(category.total_amount || 0),
      percentage: totalAmount > 0 ? (parseFloat(category.total_amount || 0) / totalAmount) * 100 : 0
    }));
    
    // Get upcoming payments
    const upcomingPayments = await db('bills')
      .select('id', 'name', 'amount', 'currency', 'due_date')
      .where('user_id', req.user.id)
      .where('payment_status', 'pending')
      .orderBy('due_date', 'asc')
      .limit(5);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        total_bills: totalBills,
        pending_bills: pendingBills,
        paid_bills: paidBills,
        overdue_bills: overdueBills,
        total_amount: totalAmount,
        paid_amount: paidAmount,
        pending_amount: pendingAmount,
        currency: 'TRY', // Default currency
        by_category: byCategory,
        upcoming_payments: upcomingPayments
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllBills,
  getBillById,
  createBill,
  updateBill,
  updateBillPaymentStatus,
  uploadBillAttachment,
  deleteBill,
  getBillStatistics
};
