/**
 * Notification controller for Subnest backend
 * 
 * This file contains all the controller functions for notification management
 * including listing, marking as read, and sending notifications.
 */

const { db } = require('../config/database');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const notificationService = require('../services/notification.service');

/**
 * Get all notifications for the authenticated user
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const getAllNotifications = async (req, res, next) => {
  try {
    const { is_read, type, page = 1, limit = 20 } = req.query;
    
    // Build query
    let query = db('notifications')
      .where('user_id', req.user.id);
    
    // Apply filters
    if (is_read !== undefined) {
      query = query.where('is_read', is_read === 'true');
    }
    
    if (type) {
      query = query.where('type', type);
    }
    
    // Count total items
    const countQuery = query.clone();
    const { count } = await countQuery.count('* as count').first();
    const total = parseInt(count, 10);
    
    // Count unread notifications
    const unreadCountQuery = db('notifications')
      .where('user_id', req.user.id)
      .where('is_read', false)
      .count('* as count')
      .first();
    
    // Apply sorting and pagination
    query = query.orderBy('created_at', 'desc');
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    // Execute queries in parallel
    const [notifications, unreadCount] = await Promise.all([
      query,
      unreadCountQuery
    ]);
    
    // Calculate pagination info
    const pages = Math.ceil(total / limit);
    
    // Return response
    res.status(200).json({
      status: 'success',
      data: {
        items: notifications,
        pagination: {
          total,
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          pages
        },
        unread_count: parseInt(unreadCount.count, 10)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark notification as read
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if notification exists
    const notification = await db('notifications')
      .where('id', id)
      .where('user_id', req.user.id)
      .first();
    
    if (!notification) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Notification not found'
      });
    }
    
    // Mark notification as read
    await db('notifications')
      .where('id', id)
      .update({
        is_read: true,
        updated_at: new Date()
      });
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const markAllAsRead = async (req, res, next) => {
  try {
    // Mark all notifications as read
    await db('notifications')
      .where('user_id', req.user.id)
      .where('is_read', false)
      .update({
        is_read: true,
        updated_at: new Date()
      });
    
    // Return response
    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new notification
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next function
 */
const createNotification = async (req, res, next) => {
  try {
    const { user_id, title, message, type, related_id, related_type, channel } = req.body;
    
    // Check if user exists
    const user = await db('users')
      .where('id', user_id)
      .first();
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'User not found'
      });
    }
    
    // Create notification
    const notificationId = uuidv4();
    const notification = {
      id: notificationId,
      user_id,
      title,
      message,
      type,
      related_id,
      related_type,
      is_read: false,
      delivery_status: 'pending',
      channel: channel || 'push',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db('notifications').insert(notification);
    
    // Send notification based on channel
    try {
      if (notification.channel === 'push') {
        await notificationService.sendPushNotification(user_id, title, message);
      } else if (notification.channel === 'email') {
        await notificationService.sendEmailNotification(user.email, title, message);
      } else if (notification.channel === 'sms') {
        await notificationService.sendSmsNotification(user.phone_number, message);
      }
      
      // Update delivery status
      await db('notifications')
        .where('id', notificationId)
        .update({
          delivery_status: 'sent',
          sent_at: new Date(),
          updated_at: new Date()
        });
    } catch (error) {
      logger.error(`Failed to send notification: ${error.message}`, { error });
      
      // Update delivery status
      await db('notifications')
        .where('id', notificationId)
        .update({
          delivery_status: 'failed',
          updated_at: new Date()
        });
    }
    
    // Return response
    res.status(201).json({
      status: 'success',
      message: 'Notification created successfully',
      data: {
        id: notificationId
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Schedule notifications for upcoming subscriptions and bills
 * This function is meant to be called by a cron job
 */
const scheduleNotifications = async () => {
  try {
    const now = new Date();
    
    // Get all users
    const users = await db('users')
      .where('is_active', true)
      .where('is_verified', true);
    
    for (const user of users) {
      // Get user notification preferences
      const preferences = user.preferences || {};
      const notificationPrefs = preferences.notifications || {
        push_enabled: true,
        email_enabled: true,
        sms_enabled: false,
        notification_types: {
          subscription_reminder: {
            push: true,
            email: true,
            sms: false,
            days_before: 3
          },
          bill_due: {
            push: true,
            email: true,
            sms: false,
            days_before: 3
          }
        }
      };
      
      // Check if quiet hours are enabled
      const quietHours = notificationPrefs.quiet_hours || { enabled: false };
      if (quietHours.enabled) {
        const currentHour = now.getHours();
        const startHour = parseInt(quietHours.start_time.split(':')[0], 10);
        const endHour = parseInt(quietHours.end_time.split(':')[0], 10);
        
        // Skip if current time is within quiet hours
        if (
          (startHour < endHour && currentHour >= startHour && currentHour < endHour) ||
          (startHour > endHour && (currentHour >= startHour || currentHour < endHour))
        ) {
          continue;
        }
      }
      
      // Process subscription reminders
      if (notificationPrefs.notification_types.subscription_reminder) {
        const subPrefs = notificationPrefs.notification_types.subscription_reminder;
        const daysBefore = subPrefs.days_before || 3;
        
        // Calculate target date
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        // Get subscriptions due in the target date
        const subscriptions = await db('subscriptions')
          .where('user_id', user.id)
          .where('status', 'active')
          .where('next_billing_date', targetDateStr);
        
        // Create notifications for each subscription
        for (const subscription of subscriptions) {
          // Check if notification already exists
          const existingNotification = await db('notifications')
            .where('user_id', user.id)
            .where('type', 'subscription_reminder')
            .where('related_id', subscription.id)
            .where('related_type', 'subscription')
            .where(db.raw('DATE(created_at) = CURRENT_DATE'))
            .first();
          
          if (existingNotification) {
            continue;
          }
          
          // Create notifications for each enabled channel
          if (subPrefs.push && notificationPrefs.push_enabled) {
            await createNotificationRecord(
              user.id,
              `${subscription.name} aboneliğiniz yaklaşıyor`,
              `${subscription.name} aboneliğiniz ${daysBefore} gün içinde ${subscription.amount} ${subscription.currency} tutarında yenilenecek.`,
              'subscription_reminder',
              subscription.id,
              'subscription',
              'push'
            );
          }
          
          if (subPrefs.email && notificationPrefs.email_enabled) {
            await createNotificationRecord(
              user.id,
              `${subscription.name} aboneliğiniz yaklaşıyor`,
              `${subscription.name} aboneliğiniz ${daysBefore} gün içinde ${subscription.amount} ${subscription.currency} tutarında yenilenecek.`,
              'subscription_reminder',
              subscription.id,
              'subscription',
              'email'
            );
          }
          
          if (subPrefs.sms && notificationPrefs.sms_enabled) {
            await createNotificationRecord(
              user.id,
              `${subscription.name} aboneliğiniz yaklaşıyor`,
              `${subscription.name} aboneliğiniz ${daysBefore} gün içinde ${subscription.amount} ${subscription.currency} tutarında yenilenecek.`,
              'subscription_reminder',
              subscription.id,
              'subscription',
              'sms'
            );
          }
        }
      }
      
      // Process bill reminders
      if (notificationPrefs.notification_types.bill_due) {
        const billPrefs = notificationPrefs.notification_types.bill_due;
        const daysBefore = billPrefs.days_before || 3;
        
        // Calculate target date
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + daysBefore);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        // Get bills due in the target date
        const bills = await db('bills')
          .where('user_id', user.id)
          .where('payment_status', 'pending')
          .where('due_date', targetDateStr);
        
        // Create notifications for each bill
        for (const bill of bills) {
          // Check if notification already exists
          const existingNotification = await db('notifications')
            .where('user_id', user.id)
            .where('type', 'bill_due')
            .where('related_id', bill.id)
            .where('related_type', 'bill')
            .where(db.raw('DATE(created_at) = CURRENT_DATE'))
            .first();
          
          if (existingNotification) {
            continue;
          }
          
          // Create notifications for each enabled channel
          if (billPrefs.push && notificationPrefs.push_enabled) {
            await createNotificationRecord(
              user.id,
              `${bill.name} faturanız yaklaşıyor`,
              `${bill.name} faturanızın son ödeme tarihi ${daysBefore} gün içinde. Tutar: ${bill.amount} ${bill.currency}.`,
              'bill_due',
              bill.id,
              'bill',
              'push'
            );
          }
          
          if (billPrefs.email && notificationPrefs.email_enabled) {
            await createNotificationRecord(
              user.id,
              `${bill.name} faturanız yaklaşıyor`,
              `${bill.name} faturanızın son ödeme tarihi ${daysBefore} gün içinde. Tutar: ${bill.amount} ${bill.currency}.`,
              'bill_due',
              bill.id,
              'bill',
              'email'
            );
          }
          
          if (billPrefs.sms && notificationPrefs.sms_enabled) {
            await createNotificationRecord(
              user.id,
              `${bill.name} faturanız yaklaşıyor`,
              `${bill.name} faturanızın son ödeme tarihi ${daysBefore} gün içinde. Tutar: ${bill.amount} ${bill.currency}.`,
              'bill_due',
              bill.id,
              'bill',
              'sms'
            );
          }
        }
      }
    }
    
    logger.info('Notification scheduling completed');
  } catch (error) {
    logger.error('Error scheduling notifications:', error);
  }
};

/**
 * Helper function to create a notification record
 * @param {string} userId - User ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {string} relatedId - Related entity ID
 * @param {string} relatedType - Related entity type
 * @param {string} channel - Notification channel
 */
const createNotificationRecord = async (userId, title, message, type, relatedId, relatedType, channel) => {
  const notificationId = uuidv4();
  const notification = {
    id: notificationId,
    user_id: userId,
    title,
    message,
    type,
    related_id: relatedId,
    related_type: relatedType,
    is_read: false,
    delivery_status: 'pending',
    channel,
    created_at: new Date(),
    updated_at: new Date()
  };
  
  await db('notifications').insert(notification);
  
  // Get user
  const user = await db('users').where('id', userId).first();
  
  // Send notification based on channel
  try {
    if (channel === 'push') {
      await notificationService.sendPushNotification(userId, title, message);
    } else if (channel === 'email') {
      await notificationService.sendEmailNotification(user.email, title, message);
    } else if (channel === 'sms') {
      await notificationService.sendSmsNotification(user.phone_number, message);
    }
    
    // Update delivery status
    await db('notifications')
      .where('id', notificationId)
      .update({
        delivery_status: 'sent',
        sent_at: new Date(),
        updated_at: new Date()
      });
  } catch (error) {
    logger.error(`Failed to send notification: ${error.message}`, { error });
    
    // Update delivery status
    await db('notifications')
      .where('id', notificationId)
      .update({
        delivery_status: 'failed',
        updated_at: new Date()
      });
  }
};

module.exports = {
  getAllNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  scheduleNotifications
};
