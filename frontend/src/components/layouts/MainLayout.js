/**
 * Main layout component for Subnest frontend
 * 
 * This component provides the main application layout including
 * navigation, sidebar, and content area.
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Toolbar, 
  Typography, 
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Subscriptions as SubscriptionsIcon,
  Receipt as BillsIcon,
  AccountBalance as BudgetsIcon,
  Lightbulb as RecommendationsIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AdminPanelSettings as AdminIcon,
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';

import { useAuth } from '../../context/AuthContext';
import NotificationsMenu from '../notifications/NotificationsMenu';

const drawerWidth = 240;

const MainLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  
  const isUserMenuOpen = Boolean(userMenuAnchor);
  const isNotificationsOpen = Boolean(notificationsAnchor);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleUserMenuOpen = (event) => {
    setUserMenuAnchor(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setUserMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    handleUserMenuClose();
    navigate('/settings/profile');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Abonelikler', icon: <SubscriptionsIcon />, path: '/subscriptions' },
    { text: 'Faturalar', icon: <BillsIcon />, path: '/bills' },
    { text: 'Bütçeler', icon: <BudgetsIcon />, path: '/budgets' },
    { text: 'Öneriler', icon: <RecommendationsIcon />, path: '/recommendations' },
    { text: 'Raporlar', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Ayarlar', icon: <SettingsIcon />, path: '/settings' },
  ];

  // Add admin menu item if user has admin role
  if (user?.roles?.includes('admin')) {
    menuItems.push({ text: 'Admin Paneli', icon: <AdminIcon />, path: '/admin' });
  }

  const drawer = (
    <div>
      <Toolbar sx={{ justifyContent: 'center' }}>
        <Typography variant="h6" noWrap component="div">
          Subnest
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  setMobileOpen(false);
                }
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Subnest'}
          </Typography>
          
          {/* Notifications */}
          <IconButton
            color="inherit"
            onClick={handleNotificationsOpen}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* User menu */}
          <IconButton
            onClick={handleUserMenuOpen}
            color="inherit"
            sx={{ ml: 1 }}
          >
            <Avatar 
              alt={user?.first_name} 
              src={user?.profile?.profile_picture_url}
              sx={{ width: 32, height: 32 }}
            >
              {user?.first_name?.charAt(0)}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      
      {/* User menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={isUserMenuOpen}
        onClose={handleUserMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profil</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Çıkış Yap</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Notifications menu */}
      <NotificationsMenu
        anchorEl={notificationsAnchor}
        open={isNotificationsOpen}
        onClose={handleNotificationsClose}
      />
    </Box>
  );
};

export default MainLayout;
