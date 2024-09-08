import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Dimensions, Animated } from 'react-native';
import { Layout, Text, Input, Button, CheckBox, Icon, useTheme, IconProps } from '@ui-kitten/components';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useThemeToggle } from '../_layout';
import { FirebaseError } from 'firebase/app';
import { LinearGradient } from 'expo-linear-gradient'; // For gradient background
import LoadingScreen from '../../components/LoadingScreen';

const { width, height } = Dimensions.get('window');

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
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({ hasMinLength: false, hasUppercase: false, hasNumber: false });
  const [loading, setLoading] = useState(false); // Track loading state
  const [showLoader, setShowLoader] = useState(false); // Loader that shows after 2 seconds delay
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current; // Animation value for opacity

  // Set default email/password in dev mode and load remembered user
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000, // Duration for the fade-in (1 second)
      useNativeDriver: true,
    }).start();

    const loadRememberedUser = async () => {
      const savedUser = await AsyncStorage.getItem('rememberedUser');
      if (savedUser) {
        const { email, password } = JSON.parse(savedUser);
        setEmail(email);
        setPassword(password);
        setRememberMe(true);
      }
    };

    if (__DEV__) {
      setEmail('Mytting1994@gmail.com');
      setPassword('123456');
    }

    loadRememberedUser();
  }, [fadeAnim]);

  // Delay showing the loader for 2 seconds
  const startLoadingWithDelay = () => {
    setLoading(true);
    const loaderTimeout = setTimeout(() => {
      setShowLoader(true);
    }, 2000); // Show the loader only after 2 seconds

    return loaderTimeout;
  };

  const stopLoading = (loaderTimeout: NodeJS.Timeout) => {
    clearTimeout(loaderTimeout);
    setLoading(false);
    setShowLoader(false);
  };

  const simulateDelay = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, __DEV__ ? 4000 : 0); // Simulate a 4-second delay in dev mode
    });
  };

  const validateForm = () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    const passwordStrength = validatePassword(password);
    if (isSigningUp && (!passwordStrength.hasMinLength || !passwordStrength.hasUppercase || !passwordStrength.hasNumber)) {
      setError('Password does not meet the required criteria.');
      return false;
    }
    return true;
  };

  // Handle password change and update validation state
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordValidation(validatePassword(text));
  };

  const handleLogin = async () => {
    if (!auth) {
      setError('Firebase authentication is not initialized.');
      return;
    }
    if (!validateForm()) {
      return;
    }

    const loaderTimeout = startLoadingWithDelay(); // Start the loading state with delay

    try {
      await simulateDelay(); // Simulate a delay in development mode
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberedUser');
      }
      router.replace('/(tabs)/home/HomeScreen');
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getErrorMessage(error.code));
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      stopLoading(loaderTimeout); // Stop loading state when done
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

    const loaderTimeout = startLoadingWithDelay(); // Start loading state with delay

    try {
      await simulateDelay(); // Simulate a delay in development mode
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)/home/HomeScreen');
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(getErrorMessage(error.code));
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      stopLoading(loaderTimeout); // Stop loading state when done
    }
  };

  // Render password visibility toggle icon
  const renderPasswordIcon = (props: IconProps) => (
    <TouchableWithoutFeedback onPress={() => setPasswordVisible(!passwordVisible)}>
      <Icon {...props} name={passwordVisible ? 'eye' : 'eye-off'} />
    </TouchableWithoutFeedback>
  );

  // Render checkmark or cross icon for password validation
  const renderValidationIcon = (isValid: boolean) => (
    <Icon
      name={isValid ? 'checkmark-circle-2-outline' : 'close-circle-outline'}
      fill={isValid ? 'green' : 'red'}
      style={{ width: 20, height: 20, marginRight: 5 }}
    />
  );

  if (loading && showLoader) {
    return <LoadingScreen />; // Display the loading screen if the process takes more than 2 seconds
  }

  return (
    <LinearGradient
      colors={['#0D0000', 'black', '#0D0000']} // Subtle gradient background
      style={styles.background}
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.transparentBox}>
          <Text category="h1" style={[styles.title, { color: theme['color-primary-500'] }]}>
            LOGIN TO YOUR ACCOUNT
          </Text>
          <Text category="s1" appearance="hint" style={styles.subtitle}>
            Enter your login information
          </Text>
          {error && <Text status="danger" style={styles.errorText}>{error}</Text>}
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            accessoryLeft={(props) => <Icon {...props} name="email-outline" />}
          />
          <Input
            placeholder="Password"
            value={password}
            secureTextEntry={!passwordVisible}
            accessoryRight={renderPasswordIcon}
            onChangeText={handlePasswordChange} // Update password state and validation
            style={styles.input}
            accessoryLeft={(props) => <Icon {...props} name="lock-outline" />}
          />
          {/* Password validation criteria */}
          {isSigningUp && (
            <View style={styles.passwordValidation}>
              <View style={styles.validationRow}>
                {renderValidationIcon(passwordValidation.hasMinLength)}
                <Text status={passwordValidation.hasMinLength ? 'success' : 'danger'}>
                  At least 8 characters
                </Text>
              </View>
              <View style={styles.validationRow}>
                {renderValidationIcon(passwordValidation.hasUppercase)}
                <Text status={passwordValidation.hasUppercase ? 'success' : 'danger'}>
                  At least 1 uppercase letter
                </Text>
              </View>
              <View style={styles.validationRow}>
                {renderValidationIcon(passwordValidation.hasNumber)}
                <Text status={passwordValidation.hasNumber ? 'success' : 'danger'}>
                  At least 1 number
                </Text>
              </View>
            </View>
          )}

          <View style={styles.rememberMeContainer}>
            <CheckBox checked={rememberMe} onChange={(nextChecked) => setRememberMe(nextChecked)}>
              Remember Me
            </CheckBox>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </View>
          <Button style={styles.loginButton} onPress={handleLogin}>
            LOGIN
          </Button>

          {/* Separator with Or */}
          <View style={styles.separatorContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>Or</Text>
            <View style={styles.line} />
          </View>

          <Button appearance="ghost" style={styles.switchButton} onPress={() => setIsSigningUp(!isSigningUp)}>
            {isSigningUp ? 'Already have an account? Sign In' : 'Don’t have an account? Sign Up'}
          </Button>

          <Button style={styles.themeToggle} appearance="ghost" onPress={toggleTheme}>
            {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          </Button>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

// Local styles defined with StyleSheet
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  transparentBox: {
    width: '90%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent background
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Subtle border
  },
  title: {
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 20,
    color: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'grey',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Slight transparency for input fields
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  forgotPassword: {
    color: '#fff',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
    marginBottom: 20,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    marginHorizontal: 10,
    color: 'grey',
  },
  switchButton: {
    marginTop: 20,
  },
  themeToggle: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
  },
  passwordValidation: {
    marginBottom: 20,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
});
