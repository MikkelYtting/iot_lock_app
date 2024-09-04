import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';  // Import only auth from your firebase config
import { signOut } from 'firebase/auth';  // Import signOut directly from the official Firebase Auth SDK
import LoadingScreen from '../components/LoadingScreen';  // Import your LoadingScreen component

export default function InitialRouting() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [forceLogoutComplete, setForceLogoutComplete] = useState(false); // Track if sign out is complete
  const [user, loading, error] = useAuthState(auth);

  // Ensure Firebase is initialized before proceeding
  useEffect(() => {
    if (auth) {
      setFirebaseInitialized(true);  // Set to true once auth is defined
    }
  }, [auth]);

  // Force logout when the app starts, in development mode
  useEffect(() => {
    if (__DEV__) {  // Only force log out in development mode
      signOut(auth)
        .then(() => {
          console.log('Forced sign out on app start');
          setForceLogoutComplete(true); // Set to true after sign out completes
        })
        .catch((error: any) => {  // Explicitly specify the type of error
          console.error('Error during forced sign out:', error);
          setForceLogoutComplete(true); // Still proceed even if there's an error
        });
    } else {
      setForceLogoutComplete(true);  // Skip sign out in production mode
    }
  }, []);

  // Show loading while Firebase is initializing or if the forced logout is still in progress
  if (!firebaseInitialized || !forceLogoutComplete || loading) {
    console.log('Initializing Firebase or waiting for sign out...');
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
