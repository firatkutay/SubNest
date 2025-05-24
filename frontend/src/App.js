/**
 * Main component for Subnest frontend
 * 
 * This file serves as the entry point for the React application
 * and sets up routing, authentication, and global state.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { trTR } from 'date-fns/locale';

// Context providers
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider as CustomThemeProvider } from './context/ThemeContext';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Pages - Auth
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

// Pages - Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Pages - Subscriptions
import SubscriptionsPage from './pages/subscriptions/SubscriptionsPage';
import SubscriptionDetailPage from './pages/subscriptions/SubscriptionDetailPage';
import AddSubscriptionPage from './pages/subscriptions/AddSubscriptionPage';
import EditSubscriptionPage from './pages/subscriptions/EditSubscriptionPage';

// Pages - Bills
import BillsPage from './pages/bills/BillsPage';
import BillDetailPage from './pages/bills/BillDetailPage';
import AddBillPage from './pages/bills/AddBillPage';
import EditBillPage from './pages/bills/EditBillPage';

// Pages - Budgets
import BudgetsPage from './pages/budgets/BudgetsPage';
import BudgetDetailPage from './pages/budgets/BudgetDetailPage';
import AddBudgetPage from './pages/budgets/AddBudgetPage';
import EditBudgetPage from './pages/budgets/EditBudgetPage';

// Pages - Recommendations
import RecommendationsPage from './pages/recommendations/RecommendationsPage';

// Pages - Reports
import ReportsPage from './pages/reports/ReportsPage';

// Pages - Settings
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import NotificationSettingsPage from './pages/settings/NotificationSettingsPage';
import SecurityPage from './pages/settings/SecurityPage';

// Pages - Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Pages - Other
import NotFoundPage from './pages/NotFoundPage';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

// Admin route component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user?.roles?.includes('admin')) {
    return <Navigate to="/dashboard" />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trTR}>
        <AuthProvider>
          <CustomThemeProvider>
            <ThemeProvider>
              <NotificationProvider>
                <CssBaseline />
                <Routes>
                  {/* Auth routes */}
                  <Route element={<AuthLayout />}>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/verify-email" element={<VerifyEmailPage />} />
                  </Route>

                  {/* Protected routes */}
                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    
                    {/* Dashboard */}
                    <Route 
                      path="/dashboard" 
                      element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Subscriptions */}
                    <Route 
                      path="/subscriptions" 
                      element={
                        <ProtectedRoute>
                          <SubscriptionsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subscriptions/add" 
                      element={
                        <ProtectedRoute>
                          <AddSubscriptionPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subscriptions/:id" 
                      element={
                        <ProtectedRoute>
                          <SubscriptionDetailPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/subscriptions/:id/edit" 
                      element={
                        <ProtectedRoute>
                          <EditSubscriptionPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Bills */}
                    <Route 
                      path="/bills" 
                      element={
                        <ProtectedRoute>
                          <BillsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/bills/add" 
                      element={
                        <ProtectedRoute>
                          <AddBillPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/bills/:id" 
                      element={
                        <ProtectedRoute>
                          <BillDetailPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/bills/:id/edit" 
                      element={
                        <ProtectedRoute>
                          <EditBillPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Budgets */}
                    <Route 
                      path="/budgets" 
                      element={
                        <ProtectedRoute>
                          <BudgetsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/budgets/add" 
                      element={
                        <ProtectedRoute>
                          <AddBudgetPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/budgets/:id" 
                      element={
                        <ProtectedRoute>
                          <BudgetDetailPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/budgets/:id/edit" 
                      element={
                        <ProtectedRoute>
                          <EditBudgetPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Recommendations */}
                    <Route 
                      path="/recommendations" 
                      element={
                        <ProtectedRoute>
                          <RecommendationsPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Reports */}
                    <Route 
                      path="/reports" 
                      element={
                        <ProtectedRoute>
                          <ReportsPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Settings */}
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <SettingsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings/profile" 
                      element={
                        <ProtectedRoute>
                          <ProfilePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings/notifications" 
                      element={
                        <ProtectedRoute>
                          <NotificationSettingsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/settings/security" 
                      element={
                        <ProtectedRoute>
                          <SecurityPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Admin routes */}
                    <Route 
                      path="/admin" 
                      element={
                        <AdminRoute>
                          <AdminDashboardPage />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users" 
                      element={
                        <AdminRoute>
                          <AdminUsersPage />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users/:id" 
                      element={
                        <AdminRoute>
                          <AdminUserDetailPage />
                        </AdminRoute>
                      } 
                    />
                    <Route 
                      path="/admin/settings" 
                      element={
                        <AdminRoute>
                          <AdminSettingsPage />
                        </AdminRoute>
                      } 
                    />
                    
                    {/* 404 */}
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </NotificationProvider>
            </ThemeProvider>
          </CustomThemeProvider>
        </AuthProvider>
      </LocalizationProvider>
    </Router>
  );
}

export default App;
