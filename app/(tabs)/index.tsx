import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Input, Button } from '@ui-kitten/components';
import { useThemeToggle } from '../_layout';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginScreen() {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSignUp, setIsSignUp] = useState(false); // New state to toggle between login and signup

  const handleLoginOrSignup = () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    if (isSignUp) {
      // Sign up flow
      createUserWithEmailAndPassword(auth, username, password)
        .then((userCredential) => {
          console.log('User signed up with:', userCredential.user);
          // Redirect to your app's home screen or dashboard after successful signup
        })
        .catch((error) => {
          console.error('Signup error:', error);
          setError(error.message);
        });
    } else {
      // Login flow
      signInWithEmailAndPassword(auth, username, password)
        .then((userCredential) => {
          console.log('Logged in with:', userCredential.user);
          // Redirect to your app's home screen or dashboard after successful login
        })
        .catch((error) => {
          console.error('Login error:', error);
          setError(error.message);
        });
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category="h1" style={styles.title}>
        {isSignUp ? 'Sign Up' : 'Welcome'}
      </Text>
      <Text category="s1" appearance="hint" style={styles.subtitle}>
        {isSignUp ? 'Please sign up to continue' : 'Please sign in to continue'}
      </Text>
      {error ? (
        <Text status="danger" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
      <Input
        placeholder="Email"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <Input
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button style={styles.button} onPress={handleLoginOrSignup}>
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </Button>
      <Button
        style={styles.switchModeButton}
        appearance="ghost"
        onPress={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
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
  switchModeButton: {
    marginTop: 24,
  },
  themeToggle: {
    marginTop: 24,
  },
});
