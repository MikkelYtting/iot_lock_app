import React from 'react';
import { View, Text } from 'react-native';  // Import View and Text from react-native
import { Redirect } from 'expo-router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';  // Ensure this path points to your firebase config
import LoadingScreen from '../components/LoadingScreen';  // Import your LoadingScreen component

export default function InitialRouting() {
  // Use Firebase authentication state to know if a user is logged in
  const [user, loading, error] = useAuthState(auth!);  // Use `!` to assure TypeScript that `auth` won't be undefined

  // If still loading Firebase authentication, show the loading screen
  if (loading) {
    return <LoadingScreen />;
  }

  // If there's an error with Firebase authentication, log it and handle it
  if (error) {
    console.error('Firebase Auth Error:', error);
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: 'red' }}>Error: {error.message}</Text>
      </View>
    );
  }

  // If the user is not authenticated, redirect to the login screen
  if (!user) {
    console.log('User is not authenticated, redirecting to login screen...');
    return <Redirect href="/login/LoginScreen" />;
  }

  // If the user is authenticated, redirect to the home screen
  console.log('User is authenticated, redirecting to home screen...');
  return <Redirect href="/(tabs)/home/HomeScreen" />;
}
