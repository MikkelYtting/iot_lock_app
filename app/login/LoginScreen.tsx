import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Dimensions } from 'react-native';
import { Layout, Text, Input, Button, CheckBox, Icon, useTheme, IconProps } from '@ui-kitten/components';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage
import { useRouter } from 'expo-router';
import { useThemeToggle } from '../_layout';
import { FirebaseError } from 'firebase/app'; // Import FirebaseError from Firebase

const { width } = Dimensions.get('window'); // Get screen width

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
  const [rememberMe, setRememberMe] = useState(false); // Track remember me status
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility
  const router = useRouter();
  const [hasTypedPassword, setHasTypedPassword] = useState(false); // Track if user has started typing

  // Pre-fill email and password in development mode
  useEffect(() => {
    if (__DEV__) {
      setEmail('Mytting1994@gmail.com');
      setPassword('123456');
    }
  }, []);

  useEffect(() => {
    const loadRememberedUser = async () => {
      const savedUser = await AsyncStorage.getItem('rememberedUser');
      if (savedUser) {
        const { email, password } = JSON.parse(savedUser);
        setEmail(email);
        setPassword(password);
        setRememberMe(true); // Set remember me to true if user data exists
      }
    };
    loadRememberedUser();
  }, []);

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

  const handleLogin = async () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // If "Remember Me" is checked, save credentials locally
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberedUser'); // Clear if unchecked
      }

      router.replace('/(tabs)/home/HomeScreen');
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error('Login error:', error.message);
        setError(getErrorMessage(error.code));
      } else {
        console.error('Unknown login error:', error);
        setError('An unknown error occurred.');
      }
    }
  };

  const handleSignup = async () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/home/HomeScreen');
    } catch (error) {
      if (error instanceof FirebaseError) {
        console.error('Signup error:', error.message);
        setError(getErrorMessage(error.code));
      } else {
        console.error('Unknown signup error:', error);
        setError('An unknown error occurred.');
      }
    }
  };

  // Render password visibility toggle icon
  const renderPasswordIcon = (props: IconProps) => (
    <TouchableWithoutFeedback onPress={() => setPasswordVisible(!passwordVisible)}>
      <Icon {...props} name={passwordVisible ? 'eye' : 'eye-off'} />
    </TouchableWithoutFeedback>
  );

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
        secureTextEntry={!passwordVisible} // Toggle visibility
        accessoryRight={renderPasswordIcon} // Show eye icon
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

      {/* Remember Me Checkbox */}
      <View style={styles.rememberMeContainer}>
        <CheckBox
          checked={rememberMe}
          onChange={(checked) => setRememberMe(checked)}
          style={styles.checkbox}
        >
          Remember Me
        </CheckBox>
      </View>

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

// Local styles defined with StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0.05 * width, // 5% padding based on screen width
  },
  title: {
    marginBottom: 0.06 * width, // Reduced margin between title and subtitle
    fontSize: 0.08 * width, // Dynamic font size for title
  },
  subtitle: {
    marginBottom: 0.04 * width, // Adjusted margin between subtitle and inputs
    fontSize: 0.045 * width,
  },
  errorText: {
    color: 'red',
    marginBottom: 0.04 * width,
    fontSize: 0.04 * width,
  },
  input: {
    marginBottom: 0.02 * width, // Reduced space between email and password fields
    width: '100%',
    fontSize: 0.045 * width,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-start', // Align checkbox to the left
  },
  checkbox: {
    marginTop: 0.02 * width,
  },
  passwordCriteria: {
    marginTop: 0.02 * width,
    width: '100%',
  },
  valid: {
    color: 'green',
  },
  invalid: {
    color: 'red',
  },
  button: {
    marginTop: 0.04 * width,
    width: '100%',
  },
  switchButton: {
    marginTop: 0.04 * width,
    width: '100%',
  },
  themeToggle: {
    marginTop: 0.06 * width,
  },
});
