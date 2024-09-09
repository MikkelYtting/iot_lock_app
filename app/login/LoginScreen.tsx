import LoadingScreen from '../../components/LoadingScreen';
import FormValidation from '../../components/FormValidation';

import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Dimensions, Animated, Platform } from 'react-native';
import { Layout, Text, Input, Button, CheckBox, Icon, useTheme, IconProps } from '@ui-kitten/components';
import { auth, GoogleAuthProvider, googleClientId, firestore } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useThemeToggle } from '../_layout';
import { FirebaseError } from 'firebase/app';
import { LinearGradient } from 'expo-linear-gradient';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const { width } = Dimensions.get('window');

// Helper function to generate random data manually
const getRandomName = () => {
  const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie'];
  const lastNames = ['Doe', 'Smith', 'Brown', 'Johnson', 'Lee'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
};

const getRandomAddress = () => {
  const streets = ['Main St', 'High St', 'Elm St', 'Maple Ave', 'Oak St'];
  const streetNumber = Math.floor(Math.random() * 1000) + 1;
  return `${streetNumber} ${streets[Math.floor(Math.random() * streets.length)]}`;
};

const getRandomDob = () => {
  const year = Math.floor(Math.random() * 30) + 1970;  // Random year between 1970 and 2000
  const month = Math.floor(Math.random() * 12) + 1;    // Random month between 1 and 12
  const day = Math.floor(Math.random() * 28) + 1;      // Random day between 1 and 28
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
};

const getRandomPhone = () => {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const centralOfficeCode = Math.floor(Math.random() * 900) + 100;
  const lineNumber = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${areaCode}-${centralOfficeCode}-${lineNumber}`;
};

const getRandomPassword = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export default function LoginScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Set up Google Sign-In with Firebase
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,  // Client ID from firebase.ts
    redirectUri: makeRedirectUri({
      scheme: Platform.OS === 'ios' ? 'arguslocks' : undefined,  // Use custom URI scheme for iOS, but not Android
    }),
  });

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
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
      setEmail('test@example.com');
      setPassword('password');
    }

    loadRememberedUser();
  }, [fadeAnim]);

  // Handle Google Sign-In response and check for first-time sign-in
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));

          if (userDoc.exists()) {
            // User has completed setup before, redirect to home screen
            router.replace('/(tabs)/home/HomeScreen');
          } else {
            // First time sign-up, redirect to UserSetupScreen to complete profile
            router.replace('/UserSetupScreen');
          }
        })
        .catch((error) => {
          console.error('Google Sign-In error:', error);
        });
    }
  }, [response]);

  const startLoadingWithDelay = () => {
    setLoading(true);
    const loaderTimeout = setTimeout(() => {
      setShowLoader(true);
    }, 2000);
    return loaderTimeout;
  };

  const stopLoading = (loaderTimeout: NodeJS.Timeout) => {
    clearTimeout(loaderTimeout);
    setLoading(false);
    setShowLoader(false);
  };

  const simulateDelay = () => {
    return new Promise((resolve) => {
      setTimeout(resolve, __DEV__ ? 4000 : 0);
    });
  };

  const handleLogin = async () => {
    const loaderTimeout = startLoadingWithDelay();
    try {
      await simulateDelay();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedUser', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberedUser');
      }
      router.replace('/(tabs)/home/HomeScreen');
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      stopLoading(loaderTimeout);
    }
  };

  const handleSignup = async () => {
    const loaderTimeout = startLoadingWithDelay();
    try {
      await simulateDelay();

      // If in development mode, generate random name, address, and phone
      if (__DEV__) {
        setName(getRandomName());
        setAddress(getRandomAddress());
        setPhone(getRandomPhone());
        setDob(getRandomDob());
        setPassword(getRandomPassword());
        console.log(`Generated random user: ${name}, ${address}, ${phone}, ${dob}`);
      }

      // Ensure the password meets certain criteria
      if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        setError('Password must be at least 8 characters long and contain both letters and numbers.');
        stopLoading(loaderTimeout);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional user info to Firestore
      await setDoc(doc(firestore, 'users', user.uid), {
        name,
        dob,
        phone,
        address,
        email: user.email, // Save the user's email
      });

      // Redirect to home screen after saving the user info
      router.replace('/(tabs)/home/HomeScreen');

      setEmail('');  // Reset form fields after sign-up
      setPassword('');
      setName('');
      setDob('');
      setPhone('');
      setAddress('');
    } catch (error) {
      if (error instanceof FirebaseError) {
        setError(error.message);
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      stopLoading(loaderTimeout);
    }
  };

  const renderPasswordIcon = (props: IconProps) => (
    <TouchableWithoutFeedback onPress={() => setPasswordVisible(!passwordVisible)}>
      <Icon {...props} name={passwordVisible ? 'eye' : 'eye-off'} />
    </TouchableWithoutFeedback>
  );

  const renderIcon = (name: string) => (props: IconProps) => (
    <Icon {...props} name={name} />
  );

  if (loading && showLoader) {
    return <LoadingScreen />;
  }

  return (
    <LinearGradient colors={['#0D0000', 'black', '#0D0000']} style={styles.background}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        <View style={styles.transparentBox}>
          <Text category="h1" style={[styles.title, { color: theme['color-primary-500'] }]}>
            {isSigningUp ? 'CREATE YOUR ACCOUNT' : 'LOGIN TO YOUR ACCOUNT'}
          </Text>
          <Text category="s1" appearance="hint" style={styles.subtitle}>
            {isSigningUp ? 'Enter your details to create an account' : 'Enter your login information'}
          </Text>
          {error && <Text status="danger" style={styles.errorText}>{error}</Text>}
          
          {isSigningUp && (
            <>
              <Input
                placeholder="Name"
                value={name}
                onChangeText={setName}
                accessoryLeft={renderIcon('person-outline')}
                style={styles.input}
              />
              <Input
                placeholder="Date of Birth"
                value={dob}
                onChangeText={setDob}
                accessoryLeft={renderIcon('calendar-outline')}
                style={styles.input}
              />
              <Input
                placeholder="Phone Number"
                value={phone}
                onChangeText={setPhone}
                accessoryLeft={renderIcon('phone-outline')}
                style={styles.input}
              />
            </>
          )}
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            accessoryLeft={renderIcon('email-outline')}
          />
          <Input
            placeholder="Password"
            value={password}
            secureTextEntry={!passwordVisible}
            accessoryRight={renderPasswordIcon}
            onChangeText={setPassword}
            style={styles.input}
            accessoryLeft={renderIcon('lock-outline')}
          />
          <FormValidation email={email} password={password} isSigningUp={isSigningUp} />

          <View style={styles.rememberMeContainer}>
            <CheckBox checked={rememberMe} onChange={(nextChecked) => setRememberMe(nextChecked)}>
              Remember Me
            </CheckBox>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </View>

          <Button style={styles.loginButton} onPress={isSigningUp ? handleSignup : handleLogin}>
            {isSigningUp ? 'CREATE USER' : 'LOGIN WITH EMAIL'}
          </Button>

          <Button style={styles.googleButton} onPress={() => promptAsync()}>
            {isSigningUp ? 'SIGN UP WITH GOOGLE' : 'LOGIN WITH GOOGLE'}
          </Button>

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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
  googleButton: {
    backgroundColor: '#4285F4',
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
});
