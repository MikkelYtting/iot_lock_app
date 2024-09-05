import React from 'react';
import { Tabs } from 'expo-router';
import { useColorScheme, Dimensions } from 'react-native';
import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useTheme } from '@ui-kitten/components'; // Added useTheme

const { width } = Dimensions.get('window'); // Get screen dimensions

export default function TabLayout() {
  const theme = useTheme(); // Access the current theme
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme['color-primary-500'], // Active tab color
        tabBarInactiveTintColor: theme['text-basic-color'], // Inactive tab color
        tabBarLabelStyle: { fontSize: 0.04 * width }, // Responsive font size for tabs
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
