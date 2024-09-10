import FormValidation from '../../components/LoginScreenComponents/FormValidation';
import GlobalStyles from '../../Styles/GlobalStyles';  
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableWithoutFeedback, Animated, Platform } from 'react-native';
import { Text, Input, Button, Icon, CheckBox, useTheme, IconProps } from '@ui-kitten/components'; // Import CheckBox
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
import LoadingScreen from '@/components/LoadingScreen';

export default function LoginScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Added confirmPassword for validation
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [emailError, setEmailError] = useState(''); // Modify to hold the error message
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: googleClientId,
    redirectUri: makeRedirectUri({
      scheme: Platform.OS === 'ios' ? 'arguslocks' : undefined,
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

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;

      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          const user = userCredential.user;
          const userDoc = await getDoc(doc(firestore, 'users', user.uid));

          if (userDoc.exists()) {
            router.replace('/(tabs)/home/HomeScreen');
          } else {
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

  // Email validation helper function
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    setEmailError(''); // Reset email error before validation
    setError(''); // Reset error before validation
    const loaderTimeout = startLoadingWithDelay();
    try {
      await simulateDelay();
      if (!validateEmail(email)) {
        setEmailError('Invalid email format'); // Show error if email is invalid
        stopLoading(loaderTimeout);
        return;
      }
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
    setEmailError(''); // Reset email error before validation
    setError(''); // Reset error before validation
    const loaderTimeout = startLoadingWithDelay();
    try {
      await simulateDelay();

      if (!validateEmail(email)) {
        setEmailError('Invalid email format'); // Show error if email is invalid
        stopLoading(loaderTimeout);
        return;
      }

      if (password !== confirmPassword) {
        setPasswordError('Passwords do not match');
        stopLoading(loaderTimeout);
        return;
      }

      if (password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password)) {
        setError('Password must be at least 8 characters long and contain both letters and numbers.');
        stopLoading(loaderTimeout);
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        name,
        email: user.email,
      });

      router.replace('/(tabs)/home/HomeScreen');

      setEmail('');  
      setPassword('');
      setConfirmPassword('');
      setName('');
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

  const preventCopyPaste = {
    onPaste: (e: any) => e.preventDefault(),
    onCopy: (e: any) => e.preventDefault(),
  };

  if (loading && showLoader) {
    return <LoadingScreen />;
  }

  return (
    <LinearGradient colors={['#0D0000', 'black', '#0D0000']} style={GlobalStyles.background}>
      <Animated.View style={[GlobalStyles.container, { opacity: fadeAnim }]}>
        <View style={GlobalStyles.transparentBox}>
          <Text category="h1" style={[GlobalStyles.title, { color: theme['color-primary-500'] }]}>
            {isSigningUp ? 'CREATE YOUR ACCOUNT' : 'LOGIN TO YOUR ACCOUNT'}
          </Text>
          <Text category="s1" appearance="hint" style={GlobalStyles.subtitle}>
            {isSigningUp ? 'Enter your details to create an account' : 'Enter your login information'}
          </Text>
          
          {isSigningUp && (
            <>
              <Input
                placeholder="First Name"
                value={name}
                onChangeText={setName}
                accessoryLeft={renderIcon('person-outline')}
                style={GlobalStyles.input}
              />

              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={GlobalStyles.input}
                accessoryLeft={renderIcon('email-outline')}
              />
              {emailError && <Text status="danger" style={GlobalStyles.errorText}>{emailError}</Text>}
              
              <Input
                placeholder="Password"
                value={password}
                secureTextEntry={true}  // No show password on signup
                onChangeText={setPassword}
                style={GlobalStyles.input}
                accessoryLeft={renderIcon('lock-outline')}
              />

              <Input
                placeholder="Confirm Password"
                value={confirmPassword}
                secureTextEntry={true}  // No show password on signup
                onChangeText={setConfirmPassword}
                style={GlobalStyles.input}
                accessoryLeft={renderIcon('lock-outline')}
                {...preventCopyPaste}
              />

              {passwordError && <Text status="danger" style={GlobalStyles.errorText}>{passwordError}</Text>}
            </>
          )}

          {!isSigningUp && (
            <>
              <Input
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={GlobalStyles.input}
                accessoryLeft={renderIcon('email-outline')}
              />
              {emailError && <Text status="danger" style={GlobalStyles.errorText}>{emailError}</Text>}
              
              <Input
                placeholder="Password"
                value={password}
                secureTextEntry={!passwordVisible}
                accessoryRight={renderPasswordIcon}
                onChangeText={setPassword}
                style={GlobalStyles.input}
                accessoryLeft={renderIcon('lock-outline')}
              />
            </>
          )}

          {error && <Text status="danger" style={GlobalStyles.errorText}>{error}</Text>}

          <FormValidation email={email} password={password} confirmPassword={confirmPassword} isSigningUp={isSigningUp} />

          {!isSigningUp && (
            <View style={GlobalStyles.rememberMeContainer}>
              <CheckBox checked={rememberMe} onChange={(nextChecked: boolean) => setRememberMe(nextChecked)}>
                Remember Me
              </CheckBox>
              <Text style={GlobalStyles.forgotPassword}>Forgot Password?</Text>
            </View>
          )}

          <Button style={GlobalStyles.loginButton} onPress={isSigningUp ? handleSignup : handleLogin}>
            {isSigningUp ? 'CREATE USER' : 'LOGIN WITH EMAIL'}
          </Button>

          <Button style={GlobalStyles.googleButton} onPress={() => promptAsync()}>
            {isSigningUp ? 'SIGN UP WITH GOOGLE' : 'LOGIN WITH GOOGLE'}
          </Button>

          <View style={GlobalStyles.separatorContainer}>
            <View style={GlobalStyles.line} />
            <Text style={GlobalStyles.orText}>Or</Text>
            <View style={GlobalStyles.line} />
          </View>

          <Button appearance="ghost" style={GlobalStyles.switchButton} onPress={() => setIsSigningUp(!isSigningUp)}>
            {isSigningUp ? 'Already have an account? Sign In' : 'Don’t have an account? Sign Up'}
          </Button>

          <Button style={GlobalStyles.themeToggle} appearance="ghost" onPress={toggleTheme}>
            {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          </Button>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}
