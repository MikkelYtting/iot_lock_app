import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router'; // For navigation
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';
import LoadingScreen from './LoadingScreen';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, loading, error] = useAuthState(auth);
  const router = useRouter();

  // Helper function for development logs
  const logDev = (message: string, details?: any) => {
    if (__DEV__) {
      console.log(message, details);
    }
  };

  useEffect(() => {
    logDev('Auth state changed:', { user, loading, error });

    if (!loading && !user) {
      logDev('User is not authenticated, redirecting to login...');
      router.replace('/login/LoginScreen');
    }
  }, [loading, user, router]);

  if (loading) {
    logDev('Loading authentication state...');
    return <LoadingScreen />; // Show loading screen while authentication is in progress
  }

  if (error) {
    logDev('Authentication error encountered:', error);

    const errorMessage = error.message ? `Error: ${error.message}` : 'An unknown error occurred';

    return (
      <View style={styles.errorContainer}>
        {/* Wrap error message in <Text> */}
        <Text>{errorMessage}</Text>
      </View>
    );
  }

  // Debug: Render and log all child components to identify problematic renders
  logDev('User authenticated. Rendering children components.');

  return (
    <View style={styles.container}>
      {React.Children.map(children, (child, index) => {
        logDev(`Rendering child component at index ${index}:`, child);

        // Check for raw text elements directly in the JSX
        if (typeof child === 'string' || typeof child === 'number') {
          logDev(`Error: Detected raw text element "${child}". Text elements must be wrapped in <Text> components.`);
          return (
            <Text style={{ color: 'red' }}>
              Error: Raw text element "{child}" detected. Please wrap it in a &lt;Text&gt; component.
            </Text>
          );
        }

        // Check if the element contains a space or other whitespace character
        if (React.isValidElement(child) && typeof child.props.children === 'string' && child.props.children.trim() === '') {
          logDev(`Error: Found an empty text element or a space in child at index ${index}.`);
          return (
            <Text style={{ color: 'red' }}>
              Error: Detected an empty text element or a space. Please ensure no empty strings are rendered directly.
            </Text>
          );
        }

        return child;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
