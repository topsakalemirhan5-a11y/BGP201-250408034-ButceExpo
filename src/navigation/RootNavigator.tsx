import React from 'react';
import { Text, StatusBar } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import TransactionsScreen from '../screens/TransactionsScreen';
import BudgetsScreen from '../screens/BudgetsScreen';
import StatsScreen from '../screens/StatsScreen';
import RecurringScreen from '../screens/RecurringScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { useColors, useIsDark } from '../theme';

const Tab = createBottomTabNavigator();

const icon = (emoji: string) => () => <Text style={{ fontSize: 20 }}>{emoji}</Text>;

export default function RootNavigator() {
  const isDark = useIsDark();
  const c = useColors();
  const base = isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.bg,
      card: c.card,
      text: c.text,
      border: c.border,
      primary: c.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <Tab.Navigator>
        <Tab.Screen name="Özet" component={DashboardScreen} options={{ tabBarIcon: icon('🏠') }} />
        <Tab.Screen name="İşlemler" component={TransactionsScreen} options={{ tabBarIcon: icon('📋') }} />
        <Tab.Screen name="Bütçe" component={BudgetsScreen} options={{ tabBarIcon: icon('🎯') }} />
        <Tab.Screen name="Tekrar" component={RecurringScreen} options={{ tabBarIcon: icon('🔁') }} />
        <Tab.Screen name="Grafik" component={StatsScreen} options={{ tabBarIcon: icon('📊') }} />
        <Tab.Screen name="Yedek" component={SettingsScreen} options={{ tabBarIcon: icon('💾') }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}