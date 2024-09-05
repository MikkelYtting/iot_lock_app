import React, { useState } from 'react';
import { View } from 'react-native';
import { Layout, Text, Input, Button, useTheme } from '@ui-kitten/components';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useThemeToggle } from '../_layout';
import { loginStyles as styles } from '../../Styles/GlobalStyles'; // Import the styles

// Helper function to validate email format
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to map Firebase errors to user-friendly messages
const getErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    'auth/invalid-email': 'Invalid email address format.',
    'auth/user-disabled': 'Your account has been disabled. Please contact support.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'This email is already in use. Try logging in or use a different email.',
    'auth/weak-password': 'The password is too weak. Please use a stronger password.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
  };

  return errorMessages[errorCode] || 'Something went wrong. Please try again.';
};

// Helper function to check password strength
const validatePassword = (password: string) => {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return { hasMinLength, hasUppercase, hasNumber };
};

export default function LoginScreen() {
  const theme = useTheme(); // Access the theme
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();
  const [hasTypedPassword, setHasTypedPassword] = useState(false); // Track if user has started typing

  // Real-time password feedback
  const passwordStrength = validatePassword(password);

  const validateForm = () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (isSigningUp && (!passwordStrength.hasMinLength || !passwordStrength.hasUppercase || !passwordStrength.hasNumber)) {
      setError('Password does not meet the required criteria.');
      return false;
    }
    return true;
  };

  const handleLogin = () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('Logged in with:', userCredential.user);
        router.replace('/(tabs)/home/HomeScreen');
      })
      .catch((error) => {
        console.error('Login error:', error);
        setError(getErrorMessage(error.code));
      });
  };

  const handleSignup = () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('User signed up with:', userCredential.user);
        router.replace('/(tabs)/home/HomeScreen');
      })
      .catch((error) => {
        console.error('Signup error:', error);
        setError(getErrorMessage(error.code));
      });
  };

  return (
    <Layout style={styles.container}>
      <Text category="h1" style={[styles.title, { color: theme['color-primary-500'] }]}>
        Welcome
      </Text>
      <Text category="s1" appearance="hint" style={styles.subtitle}>
        {isSigningUp ? 'Create a new account' : 'Please sign in to continue'}
      </Text>
      {error && (
        <Text status="danger" style={styles.errorText}>
          {error}
        </Text>
      )}
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        placeholderTextColor={theme['color-primary-300']} // Light red placeholder
      />
      <Input
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={(text) => {
          setPassword(text);
          if (text.length > 0) {
            setHasTypedPassword(true); // Set true once the user starts typing
          } else {
            setHasTypedPassword(false); // Reset if the field is cleared
          }
        }}
        style={styles.input}
        placeholderTextColor={theme['color-primary-300']}
      />

      {isSigningUp && hasTypedPassword && (
        <View style={styles.passwordCriteria}>
          <Text style={[passwordStrength.hasMinLength ? styles.valid : styles.invalid]}>
            {passwordStrength.hasMinLength ? '✔' : '✘'} At least 8 characters
          </Text>
          <Text style={[passwordStrength.hasUppercase ? styles.valid : styles.invalid]}>
            {passwordStrength.hasUppercase ? '✔' : '✘'} At least one uppercase letter
          </Text>
          <Text style={[passwordStrength.hasNumber ? styles.valid : styles.invalid]}>
            {passwordStrength.hasNumber ? '✔' : '✘'} At least one number
          </Text>
        </View>
      )}

      {isSigningUp ? (
        <Button style={styles.button} status="primary" onPress={handleSignup}>
          Sign Up
        </Button>
      ) : (
        <Button style={styles.button} status="primary" onPress={handleLogin}>
          Sign In
        </Button>
      )}
      <Button
        style={styles.switchButton}
        appearance="ghost"
        onPress={() => setIsSigningUp(!isSigningUp)}
      >
        {isSigningUp ? 'Already have an account? Sign In' : 'Don’t have an account? Sign Up'}
      </Button>
      <Button style={styles.themeToggle} appearance="ghost" onPress={toggleTheme}>
        {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      </Button>
    </Layout>
  );
}
