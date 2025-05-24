/**
 * Notifications menu component for Subnest frontend
 * 
 * This component displays a dropdown menu with recent notifications
 * and provides options to view all notifications or mark them as read.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Badge,
  CircularProgress
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  SubscriptionsOutlined as SubscriptionsIcon,
  ReceiptOutlined as BillsIcon,
  AccountBalanceOutlined as BudgetsIcon,
  LightbulbOutlined as RecommendationsIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

import api from '../../services/api';

const NotificationsMenu = ({ anchorEl, open, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications', {
        params: {
          limit: 5,
          page: 1
        }
      });
      
      setNotifications(response.data.data.items);
      setUnreadCount(response.data.data.unread_count);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      
      // Update local state
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, is_read: true } 
          : notification
      ));
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      
      // Update local state
      setNotifications(notifications.map(notification => ({ 
        ...notification, 
        is_read: true 
      })));
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'subscription_reminder':
        return <SubscriptionsIcon color="primary" />;
      case 'bill_due':
        return <BillsIcon color="error" />;
      case 'budget_alert':
        return <BudgetsIcon color="warning" />;
      case 'recommendation':
        return <RecommendationsIcon color="success" />;
      default:
        return <NotificationsIcon color="info" />;
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read if not already
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'subscription_reminder':
        navigate(`/subscriptions/${notification.related_id}`);
        break;
      case 'bill_due':
        navigate(`/bills/${notification.related_id}`);
        break;
      case 'budget_alert':
        navigate(`/budgets/${notification.related_id}`);
        break;
      case 'recommendation':
        navigate('/recommendations');
        break;
      default:
        break;
    }
    
    onClose();
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          width: 320,
          maxHeight: 400,
          overflow: 'auto'
        }
      }}
    >
      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Bildirimler
          {unreadCount > 0 && (
            <Badge
              badgeContent={unreadCount}
              color="error"
              sx={{ ml: 1 }}
            />
          )}
        </Typography>
        {unreadCount > 0 && (
          <Button size="small" onClick={handleMarkAllAsRead}>
            Tümünü Okundu İşaretle
          </Button>
        )}
      </Box>
      
      <Divider />
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Bildirim bulunmuyor
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {notifications.map((notification) => (
            <ListItem
              key={notification.id}
              button
              onClick={() => handleNotificationClick(notification)}
              sx={{
                backgroundColor: notification.is_read ? 'inherit' : 'action.hover',
                '&:hover': {
                  backgroundColor: 'action.selected'
                }
              }}
            >
              <ListItemAvatar>
                <Avatar>
                  {getNotificationIcon(notification.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={notification.title}
                secondary={
                  <>
                    <Typography variant="body2" component="span" display="block" noWrap>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(notification.created_at), { 
                        addSuffix: true,
                        locale: tr
                      })}
                    </Typography>
                  </>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
      
      <Divider />
      
      <Box sx={{ p: 1 }}>
        <Button
          fullWidth
          onClick={handleViewAll}
          endIcon={<NotificationsActiveIcon />}
        >
          Tüm Bildirimleri Görüntüle
        </Button>
      </Box>
    </Menu>
  );
};

export default NotificationsMenu;
