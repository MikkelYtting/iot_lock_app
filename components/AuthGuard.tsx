import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter, Redirect } from 'expo-router';  // For navigation
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import LoadingScreen from './LoadingScreen';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Navigate to login if user is not authenticated and not loading
      router.replace('/login/LoginScreen');
    }
  }, [loading, user, router]);

  if (loading) {
    return <LoadingScreen />;  // Show loading while waiting for authentication
  }

  if (error) {
    return (
      <View>
        <Text>Error: {error.message}</Text>
      </View>
    );
  }

  // If authenticated, render children (the rest of the app)
  return <>{children}</>;
}
