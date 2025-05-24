/**
 * Main entry point for Subnest mobile app
 * 
 * This file sets up the React Native application with navigation,
 * authentication, and global state management.
 */

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Context providers
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { NotificationProvider } from './src/context/NotificationContext';

// Auth screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import VerifyEmailScreen from './src/screens/auth/VerifyEmailScreen';

// Main screens
import DashboardScreen from './src/screens/dashboard/DashboardScreen';
import SubscriptionsScreen from './src/screens/subscriptions/SubscriptionsScreen';
import SubscriptionDetailScreen from './src/screens/subscriptions/SubscriptionDetailScreen';
import AddSubscriptionScreen from './src/screens/subscriptions/AddSubscriptionScreen';
import EditSubscriptionScreen from './src/screens/subscriptions/EditSubscriptionScreen';
import BillsScreen from './src/screens/bills/BillsScreen';
import BillDetailScreen from './src/screens/bills/BillDetailScreen';
import AddBillScreen from './src/screens/bills/AddBillScreen';
import EditBillScreen from './src/screens/bills/EditBillScreen';
import BudgetsScreen from './src/screens/budgets/BudgetsScreen';
import BudgetDetailScreen from './src/screens/budgets/BudgetDetailScreen';
import AddBudgetScreen from './src/screens/budgets/AddBudgetScreen';
import EditBudgetScreen from './src/screens/budgets/EditBudgetScreen';
import RecommendationsScreen from './src/screens/recommendations/RecommendationsScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import SettingsScreen from './src/screens/settings/SettingsScreen';

// Create navigators
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
const TabNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.text,
        tabBarStyle: {
          backgroundColor: theme.colors.background,
          borderTopColor: theme.colors.border,
        },
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Icon name="view-dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Subscriptions"
        component={SubscriptionsScreen}
        options={{
          title: 'Abonelikler',
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar-sync" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Bills"
        component={BillsScreen}
        options={{
          title: 'Faturalar',
          tabBarIcon: ({ color, size }) => (
            <Icon name="receipt" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Budgets"
        component={BudgetsScreen}
        options={{
          title: 'Bütçeler',
          tabBarIcon: ({ color, size }) => (
            <Icon name="chart-pie" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Icon name="account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Auth Navigator
const AuthNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
  </Stack.Navigator>
);

// Main Navigator
const MainNavigator = () => {
  const { theme } = useTheme();
  
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
      }}
    >
      <Stack.Screen
        name="TabNavigator"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubscriptionDetail"
        component={SubscriptionDetailScreen}
        options={{ title: 'Abonelik Detayı' }}
      />
      <Stack.Screen
        name="AddSubscription"
        component={AddSubscriptionScreen}
        options={{ title: 'Abonelik Ekle' }}
      />
      <Stack.Screen
        name="EditSubscription"
        component={EditSubscriptionScreen}
        options={{ title: 'Abonelik Düzenle' }}
      />
      <Stack.Screen
        name="BillDetail"
        component={BillDetailScreen}
        options={{ title: 'Fatura Detayı' }}
      />
      <Stack.Screen
        name="AddBill"
        component={AddBillScreen}
        options={{ title: 'Fatura Ekle' }}
      />
      <Stack.Screen
        name="EditBill"
        component={EditBillScreen}
        options={{ title: 'Fatura Düzenle' }}
      />
      <Stack.Screen
        name="BudgetDetail"
        component={BudgetDetailScreen}
        options={{ title: 'Bütçe Detayı' }}
      />
      <Stack.Screen
        name="AddBudget"
        component={AddBudgetScreen}
        options={{ title: 'Bütçe Ekle' }}
      />
      <Stack.Screen
        name="EditBudget"
        component={EditBudgetScreen}
        options={{ title: 'Bütçe Düzenle' }}
      />
      <Stack.Screen
        name="Recommendations"
        component={RecommendationsScreen}
        options={{ title: 'Öneriler' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: 'Bildirimler' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Ayarlar' }}
      />
    </Stack.Navigator>
  );
};

// Root Navigator
const RootNavigator = () => {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();
  
  if (loading) {
    // Show loading screen
    return null;
  }
  
  return (
    <NavigationContainer theme={theme.navigation}>
      <StatusBar
        backgroundColor={theme.colors.background}
        barStyle={theme.dark ? 'light-content' : 'dark-content'}
      />
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// App component
const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <PaperProvider>
          <AuthProvider>
            <NotificationProvider>
              <RootNavigator />
            </NotificationProvider>
          </AuthProvider>
        </PaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
