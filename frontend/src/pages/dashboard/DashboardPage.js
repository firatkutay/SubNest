/**
 * Dashboard page component for Subnest frontend
 * 
 * This component displays an overview of the user's subscriptions, bills,
 * budgets, and recommendations with key statistics and upcoming payments.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowForward as ArrowForwardIcon,
  Subscriptions as SubscriptionsIcon,
  Receipt as BillsIcon,
  AccountBalance as BudgetsIcon,
  Lightbulb as RecommendationsIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const DashboardPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    subscriptions: {
      total: 0,
      active: 0,
      monthly_cost: 0,
      by_category: []
    },
    bills: {
      total: 0,
      pending: 0,
      overdue: 0,
      pending_amount: 0
    },
    budgets: {
      total: 0,
      percentage_used: 0,
      remaining: 0
    },
    recommendations: {
      total: 0,
      potential_savings: 0
    },
    upcoming_payments: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data in parallel
      const [subscriptionsRes, billsRes, budgetsRes, recommendationsRes] = await Promise.all([
        api.get('/subscriptions/statistics'),
        api.get('/bills/statistics'),
        api.get('/budgets/statistics'),
        api.get('/recommendations', { params: { is_dismissed: false, is_applied: false } })
      ]);
      
      // Combine data
      setDashboardData({
        subscriptions: subscriptionsRes.data.data,
        bills: billsRes.data.data,
        budgets: budgetsRes.data.data,
        recommendations: {
          total: recommendationsRes.data.data.pagination.total,
          potential_savings: recommendationsRes.data.data.total_potential_savings
        },
        upcoming_payments: [
          ...subscriptionsRes.data.data.upcoming_payments.map(payment => ({
            ...payment,
            type: 'subscription'
          })),
          ...billsRes.data.data.upcoming_payments.map(payment => ({
            ...payment,
            type: 'bill'
          }))
        ].sort((a, b) => new Date(a.due_date) - new Date(b.due_date)).slice(0, 5)
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    theme.palette.success.main,
    theme.palette.error.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.grey[500]
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Dashboard
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/subscriptions/add')}
            sx={{ mr: 1 }}
          >
            Abonelik Ekle
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<AddIcon />}
            onClick={() => navigate('/bills/add')}
          >
            Fatura Ekle
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderLeft: `4px solid ${theme.palette.primary.main}`
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Aktif Abonelikler
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {dashboardData.subscriptions.active}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
              <Typography variant="body2" color="text.secondary">
                Aylık Maliyet: {formatCurrency(dashboardData.subscriptions.monthly_cost, 'TRY')}
              </Typography>
              <SubscriptionsIcon color="primary" />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderLeft: `4px solid ${theme.palette.error.main}`
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Bekleyen Faturalar
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {dashboardData.bills.pending + dashboardData.bills.overdue}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
              <Typography variant="body2" color="text.secondary">
                Toplam: {formatCurrency(dashboardData.bills.pending_amount, 'TRY')}
              </Typography>
              <BillsIcon color="error" />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderLeft: `4px solid ${theme.palette.success.main}`
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Bütçe Durumu
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              %{Math.round(dashboardData.budgets.percentage_used)}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
              <Typography variant="body2" color="text.secondary">
                Kalan: {formatCurrency(dashboardData.budgets.remaining, 'TRY')}
              </Typography>
              <BudgetsIcon color="success" />
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={2}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 140,
              borderLeft: `4px solid ${theme.palette.warning.main}`
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Potansiyel Tasarruf
            </Typography>
            <Typography variant="h4" component="div" sx={{ mb: 1 }}>
              {formatCurrency(dashboardData.recommendations.potential_savings, 'TRY')}
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
              <Typography variant="body2" color="text.secondary">
                {dashboardData.recommendations.total} öneri
              </Typography>
              <RecommendationsIcon color="warning" />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts and Lists */}
      <Grid container spacing={3}>
        {/* Subscription Categories */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Abonelik Kategorileri</Typography>
              <Button 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/subscriptions')}
                size="small"
              >
                Tümünü Gör
              </Button>
            </Box>
            
            {dashboardData.subscriptions.by_category.length > 0 ? (
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={dashboardData.subscriptions.by_category}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="monthly_cost"
                      nameKey="category"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {dashboardData.subscriptions.by_category.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value, 'TRY')}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  Henüz abonelik bulunmuyor
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Monthly Spending */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Aylık Harcama</Typography>
              <Button 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/reports')}
                size="small"
              >
                Raporlar
              </Button>
            </Box>
            
            {dashboardData.budgets.monthly_trend?.length > 0 ? (
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dashboardData.budgets.monthly_trend}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(value, 'TRY')} />
                    <Legend />
                    <Bar dataKey="budget_amount" name="Bütçe" fill={theme.palette.primary.main} />
                    <Bar dataKey="spending" name="Harcama" fill={theme.palette.error.main} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                <Typography variant="body2" color="text.secondary">
                  Henüz bütçe verisi bulunmuyor
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Upcoming Payments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Yaklaşan Ödemeler</Typography>
              <Button 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/bills')}
                size="small"
              >
                Tüm Faturalar
              </Button>
            </Box>
            
            {dashboardData.upcoming_payments.length > 0 ? (
              <List>
                {dashboardData.upcoming_payments.map((payment) => (
                  <ListItem
                    key={`${payment.type}-${payment.id}`}
                    button
                    onClick={() => navigate(`/${payment.type === 'subscription' ? 'subscriptions' : 'bills'}/${payment.id}`)}
                    sx={{ borderLeft: `3px solid ${payment.type === 'subscription' ? theme.palette.primary.main : theme.palette.error.main}` }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: payment.type === 'subscription' ? 'primary.main' : 'error.main' }}>
                        {payment.type === 'subscription' ? <SubscriptionsIcon /> : <BillsIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={payment.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {formatCurrency(payment.amount, payment.currency)}
                          </Typography>
                          {' — '}
                          {format(new Date(payment.due_date), 'PPP', { locale: tr })}
                        </>
                      }
                    />
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      <CalendarIcon fontSize="small" sx={{ mr: 0.5 }} />
                      {format(new Date(payment.due_date), 'dd MMM', { locale: tr })}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body2" color="text.secondary">
                  Yaklaşan ödeme bulunmuyor
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recommendations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Öneriler</Typography>
              <Button 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/recommendations')}
                size="small"
              >
                Tüm Öneriler
              </Button>
            </Box>
            
            {dashboardData.recommendations.total > 0 ? (
              <Card variant="outlined" sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                      <RecommendationsIcon />
                    </Avatar>
                    <Typography variant="h6">
                      Aylık {formatCurrency(dashboardData.recommendations.potential_savings, 'TRY')} tasarruf potansiyeli
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {dashboardData.recommendations.total} öneri ile aboneliklerinizi optimize edebilir ve tasarruf sağlayabilirsiniz.
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    color="warning"
                    onClick={() => navigate('/recommendations')}
                  >
                    Önerileri İncele
                  </Button>
                </CardActions>
              </Card>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body2" color="text.secondary">
                  Şu anda öneri bulunmuyor
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
