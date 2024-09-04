import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useTheme } from '@ui-kitten/components'; // Added useTheme

export default function TabLayout() {
  const theme = useTheme(); // Access the current theme
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme['color-primary-500'], // Red for active tab
        tabBarInactiveTintColor: theme['text-basic-color'], // Contrast color for inactive tab (e.g., white or black)
        headerShown: false, // Hide the header globally for all tabs
      }}
    >
      <Tabs.Screen
        name="home/HomeScreen"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings/SettingsScreen"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
