// File: app/(tabs)/settings/_layout.tsx
import React from 'react';
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack>
      <Stack.Screen name="SettingsScreen" options={{ title: 'Settings' }} />
      <Stack.Screen name="AccountScreen" options={{ title: 'Account Settings' }} />
      <Stack.Screen name="PinVerificationScreen" options={{ title: 'Verify PIN', presentation: 'modal' }} /> {/* Add PinVerificationScreen */}
    </Stack>
  );
}
