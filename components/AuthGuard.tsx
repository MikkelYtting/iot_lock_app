import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';  // For navigation
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import LoadingScreen from './LoadingScreen';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // If user is not authenticated, redirect to the login screen
      router.replace('/login/LoginScreen');
    }
  }, [loading, user, router]);

  if (loading) {
    return <LoadingScreen />;  // Show loading screen while authentication is in progress
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  // If authenticated, show the child components (the rest of the app)
  return <>{children}</>;
}
