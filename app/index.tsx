import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthLoadingScreen() {
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);
  const [forceLogoutComplete, setForceLogoutComplete] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false); // Track session check
  const [user, loading, error] = useAuthState(auth);

  // Ensure Firebase is initialized before proceeding
  useEffect(() => {
    if (auth) {
      setFirebaseInitialized(true);
    }
  }, [auth]);

  // Force logout when the app starts in development mode
  useEffect(() => {
    if (__DEV__) {
      signOut(auth)
        .then(() => {
          console.log('Forced sign out on app start');
          setForceLogoutComplete(true);
        })
        .catch((error: any) => {
          console.error('Error during forced sign out:', error);
          setForceLogoutComplete(true);
        });
    } else {
      setForceLogoutComplete(true);
    }
  }, []);

  // Load the stored session (if any) from AsyncStorage
  useEffect(() => {
    const loadUserSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('rememberedUser');
        if (storedUser && !user) {
          // Simulate signing in user if session is found
          console.log('User session found in storage, redirecting to home screen...');
          setSessionChecked(true);
        } else {
          setSessionChecked(true);
        }
      } catch (error) {
        console.error('Error loading user session:', error);
        setSessionChecked(true);
      }
    };

    loadUserSession();
  }, [user]);

  // Show loading while Firebase is initializing, forced logout is in progress, or session is being checked
  if (!firebaseInitialized || !forceLogoutComplete || !sessionChecked || loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Handle authentication errors
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
    return <Redirect href="/login/LoginScreen" />;
  }

  // If the user is authenticated, redirect to the home screen
  return <Redirect href="/(tabs)/home/HomeScreen" />;
}
