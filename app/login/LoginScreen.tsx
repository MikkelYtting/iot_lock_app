import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Dimensions, ImageBackground } from 'react-native';
import { Layout, Text, Input, Button, CheckBox, Icon, useTheme, IconProps } from '@ui-kitten/components';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useThemeToggle } from '../_layout';
import { FirebaseError } from 'firebase/app';

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
  const router = useRouter();
  const [hasTypedPassword, setHasTypedPassword] = useState(false);

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
        setRememberMe(true);
      }
    };
    loadRememberedUser();
  }, []);

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

      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberedUser');
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
    <ImageBackground source={require('../../assets/images/login_background.jpg')} style={styles.backgroundImage}>
      <Layout style={styles.container}>
        <Text category="h1" style={[styles.title, { color: theme['color-primary-500'] }]}>
          LOGIN TO YOUR ACCOUNT
        </Text>
        <Text category="s1" appearance="hint" style={styles.subtitle}>
          Enter your login information
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
          placeholderTextColor={theme['color-primary-300']}
          accessoryLeft={(props: IconProps) => <Icon {...props} name="email-outline" />}
        />
        <Input
          placeholder="Password"
          value={password}
          secureTextEntry={!passwordVisible}
          accessoryRight={renderPasswordIcon}
          onChangeText={(text) => {
            setPassword(text);
            if (text.length > 0) {
              setHasTypedPassword(true);
            } else {
              setHasTypedPassword(false);
            }
          }}
          style={styles.input}
          placeholderTextColor={theme['color-primary-300']}
          accessoryLeft={(props: IconProps) => <Icon {...props} name="lock-outline" />}
        />

        <View style={styles.rememberMeContainer}>
          <View style={styles.rememberMeRow}>
            <CheckBox
              checked={rememberMe}
              onChange={(nextChecked) => setRememberMe(nextChecked)}
            />
            <Text style={styles.rememberMeText}>Remember me</Text>
          </View>
          <Text style={styles.forgotPassword} onPress={() => {}}>Forgot password</Text>
        </View>

        <Button style={styles.loginButton} status="danger" onPress={handleLogin}>LOGIN</Button>

        {/* Separator with Or */}
        <View style={styles.separatorContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>Or</Text>
          <View style={styles.line} />
        </View>

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
    </ImageBackground>
  );
}

// Local styles defined with StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
    backgroundColor: 'transparent', // Ensures content background is transparent
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  title: {
    textAlign: 'center',
    marginBottom: height * 0.02,
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: height * 0.02,
    color: 'grey',
  },
  errorText: {
    color: 'red',
    marginBottom: height * 0.02,
    textAlign: 'center',
  },
  input: {
    marginBottom: height * 0.015,
    width: '100%',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: height * 0.03,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    marginLeft: 8,
    color: 'grey',
  },
  forgotPassword: {
    color: 'grey',
    textDecorationLine: 'underline',
  },
  loginButton: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
    marginBottom: height * 0.04,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: height * 0.02,
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
    marginTop: height * 0.03,
  },
  themeToggle: {
    marginTop: height * 0.03,
  },
});
