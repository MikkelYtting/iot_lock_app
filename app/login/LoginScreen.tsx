import FormValidation from '../../components/LoginScreenComponents/FormValidation'; // Ensure this import exists
import { validateEmail } from '../../components/LoginScreenComponents/FormValidation'; // Import the validateEmail function
import GlobalStyles from '../../Styles/GlobalStyles';  
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableWithoutFeedback, Animated, Platform } from 'react-native';
import { Text, Input, Button, Icon, CheckBox, useTheme, IconProps } from '@ui-kitten/components'; 
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState(false); // State to track email error
  const [isEmailAttempted, setIsEmailAttempted] = useState(false); // New state to track if user has tried to submit
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
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

  const handleLogin = async () => {
    setError('');
    setIsFormSubmitted(true);

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
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
            setError('Invalid login credentials. Please try again.');
            break;
          case 'auth/user-not-found':
            setError('No account found with this email. Please sign up.');
            break;
          case 'auth/too-many-requests':
            setError('Too many login attempts. Please try again later.');
            break;
          default:
            setError('An unknown error occurred. Please try again later.');
        }
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      stopLoading(loaderTimeout);
    }
  };

  const handleSignup = async () => {
    setError('');
    setIsFormSubmitted(true);

    // Mark that the email validation attempt has been made
    setIsEmailAttempted(true);

    // Check email validation
    if (!validateEmail(email)) {
      setEmailError(true); // Show email error message
      return;
    }

    const loaderTimeout = startLoadingWithDelay();
    try {
      await simulateDelay();

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

  const handleModeSwitch = () => {
    setIsSigningUp(!isSigningUp);
    setError(''); // Clear the error when switching between login and signup
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
                onChangeText={(value) => {
                  setEmail(value);
                  // Reset email error only if it's valid
                  if (validateEmail(value)) {
                    setEmailError(false);
                  }
                }}
                style={GlobalStyles.input}
                accessoryLeft={renderIcon('email-outline')}
              />
              {/* Show email error only after the user tries to submit */}
              {isEmailAttempted && emailError && (
                <Text status="danger" style={GlobalStyles.errorText}>
                  Invalid email format
                </Text>
              )}
              
              <Input
                placeholder="Password"
                value={password}
                secureTextEntry={true}
                onChangeText={setPassword}
                style={GlobalStyles.input}
                accessoryLeft={renderIcon('lock-outline')}
              />

              <Input
                placeholder="Confirm Password"
                value={confirmPassword}
                secureTextEntry={true}
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

          <FormValidation 
            password={password} 
            confirmPassword={confirmPassword} 
            email={email}
            isSigningUp={isSigningUp} 
            isFormSubmitted={isFormSubmitted} 
          />

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

          <Button appearance="ghost" style={GlobalStyles.switchButton} onPress={handleModeSwitch}>
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
