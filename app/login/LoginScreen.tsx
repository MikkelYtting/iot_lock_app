import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Input, Button } from '@ui-kitten/components';
import { auth } from '../../firebase';  // Ensure this points to your Firebase config
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { useThemeToggle } from '../_layout';  // Assuming the theme toggle context is here

export default function LoginScreen() {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('Logged in with:', userCredential.user);
        // Redirect to HomeScreen after login
        router.replace('/(tabs)/home/HomeScreen');  // Ensure correct route to the home screen
      })
      .catch((error) => {
        console.error('Login error:', error);
        setError(error.message);
      });
  };

  const handleSignup = () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log('User signed up with:', userCredential.user);
        // Redirect to HomeScreen after signup
        router.replace('/(tabs)/home/HomeScreen');
      })
      .catch((error) => {
        console.error('Signup error:', error);
        setError(error.message);
      });
  };

  return (
    <Layout style={styles.container}>
      <Text category="h1" style={styles.title}>
        Welcome
      </Text>
      <Text category="s1" appearance="hint" style={styles.subtitle}>
        {isSigningUp ? 'Create a new account' : 'Please sign in to continue'}
      </Text>
      {error ? (
        <Text status="danger" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
      <Input
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <Input
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />
      {isSigningUp ? (
        <Button style={styles.button} onPress={handleSignup}>
          Sign Up
        </Button>
      ) : (
        <Button style={styles.button} onPress={handleLogin}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  button: {
    marginTop: 16,
    width: '100%',
  },
  switchButton: {
    marginTop: 16,
    width: '100%',
  },
  themeToggle: {
    marginTop: 24,
  },
});
