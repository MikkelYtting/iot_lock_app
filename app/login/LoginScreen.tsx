import FormValidation from '../../components/LoginScreenComponents/FormValidation'; 
import { validateEmail } from '../../components/LoginScreenComponents/FormValidation'; 
import GlobalStyles from '../../Styles/GlobalStyles';  
import React, { useState, useEffect, useRef } from 'react';
import { View, TouchableWithoutFeedback, Animated, Platform, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Text, Input, Button, Icon, CheckBox, useTheme, IconProps } from '@ui-kitten/components'; 
import { auth, GoogleAuthProvider, googleClientId, firestore } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithCredential, sendEmailVerification } from 'firebase/auth';
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
  const [emailError, setEmailError] = useState(false); 
  const [isEmailAttempted, setIsEmailAttempted] = useState(false); 
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isFormSubmitted, setIsFormSubmitted] = useState(false);
  const [emailVerified, setEmailVerified] = useState(true); // Track email verification status
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [borderAnim] = useState(new Animated.Value(0)); 
  const [passwordBorderAnim] = useState(new Animated.Value(0)); 
  const [confirmPasswordBorderAnim] = useState(new Animated.Value(0)); 

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
      setEmail('Mytting1996@gmail.com');
      setPassword('123456HH');
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
      const user = userCredential.user;

      // Check email verification status
      if (!user.emailVerified) {
        setEmailVerified(false);
        Alert.alert('Verification Required', 'Please verify your email before logging in.');
        return;
      }

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

    setIsEmailAttempted(true);
    let emailValid = true;
    if (!validateEmail(email)) {
      setEmailError(true);
      emailValid = false;
      Animated.sequence([
        Animated.timing(borderAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(borderAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    }

    const invalidPassword = password !== confirmPassword || password.length < 8 || !/\d/.test(password) || !/[a-zA-Z]/.test(password);
    if (invalidPassword) {
      setPasswordError('Passwords must match and be at least 8 characters long with both letters and numbers.');
      Animated.sequence([
        Animated.timing(passwordBorderAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(passwordBorderAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();

      Animated.sequence([
        Animated.timing(confirmPasswordBorderAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(confirmPasswordBorderAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
      ]).start();
    } else {
      setPasswordError('');
      Animated.timing(passwordBorderAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }).start();
      Animated.timing(confirmPasswordBorderAnim, {
        toValue: 0,
        duration: 0,
        useNativeDriver: false,
      }).start();
    }

    if (!emailValid || invalidPassword) {
      return;
    }

    const loaderTimeout = startLoadingWithDelay();
    try {
      await simulateDelay();

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(firestore, 'users', user.uid), {
        name,
        email: user.email,
        emailVerified: false, // Store initial email verification status
      });

      // Send verification email
      await sendEmailVerification(user);
      Alert.alert('Signup Successful', 'A verification link has been sent to your email. Please verify before logging in.');

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
    onPaste: (e: React.ClipboardEvent) => e.preventDefault(),
    onCopy: (e: React.ClipboardEvent) => e.preventDefault(),
  };

  const handleModeSwitch = () => {
    setIsSigningUp(!isSigningUp);
    setError('');
  };

  if (loading && showLoader) {
    return <LoadingScreen />;
  }

  const animatedBorderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff0000', '#ffffff'],
  });

  const animatedPasswordBorderColor = passwordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff0000', '#ffffff'],
  });

  const animatedConfirmPasswordBorderColor = confirmPasswordBorderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#ff0000', '#ffffff'],
  });

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

          {!emailVerified && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                Your email is not verified. Please check your inbox and verify your email.
              </Text>
              <Button
                appearance="ghost"
                onPress={async () => {
                  if (auth.currentUser) {
                    await sendEmailVerification(auth.currentUser);
                    Alert.alert('Verification Email Sent', 'Please check your inbox.');
                  }
                }}
              >
                Resend Verification Email
              </Button>
            </View>
          )}

          {isSigningUp && (
            <>
              <Input
                placeholder="First Name"
                value={name}
                onChangeText={setName}
                accessoryLeft={renderIcon('person-outline')}
                style={GlobalStyles.input}
              />

              <Animated.View style={{ 
                  borderColor: animatedBorderColor, 
                  borderWidth: isEmailAttempted && emailError ? 2 : 0, 
                  borderRadius: 4, 
                  overflow: 'hidden', 
                  paddingVertical: 0, 
                  marginVertical: 0
                }}>
                <Input
                  placeholder="Email"
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (validateEmail(value)) {
                      setEmailError(false); 
                    }
                  }}
                  status={isEmailAttempted && emailError ? 'danger' : 'basic'}
                  style={{...GlobalStyles.input, paddingVertical: 0, marginVertical: 0 }} 
                  accessoryLeft={renderIcon('email-outline')}
                />
              </Animated.View>
              {isEmailAttempted && emailError && (
                <Text status="danger" style={GlobalStyles.errorText}>
                  Invalid email format
                </Text>
              )}
              
              <Animated.View style={{ borderColor: animatedPasswordBorderColor, borderWidth: passwordError ? 2 : 0 }}>
                <Input
                  placeholder="Password"
                  value={password}
                  secureTextEntry={true}
                  onChangeText={setPassword}
                  style={GlobalStyles.input}
                  accessoryLeft={renderIcon('lock-outline')}
                />
              </Animated.View>

              <Animated.View style={{ borderColor: animatedConfirmPasswordBorderColor, borderWidth: passwordError ? 2 : 0 }}>
                <Input
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  secureTextEntry={true}
                  onChangeText={setConfirmPassword}
                  style={GlobalStyles.input}
                  accessoryLeft={renderIcon('lock-outline')}
                  {...preventCopyPaste}
                />
              </Animated.View>

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
            <View style={[GlobalStyles.rememberMeContainer]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <CheckBox
                  checked={rememberMe}
                  onChange={(nextChecked: boolean) => setRememberMe(nextChecked)}
                  style={GlobalStyles.checkBox}
                />
                <Text style={GlobalStyles.rememberMeText}>Remember Me</Text>
              </View>
              
              {/* Forgot Password Button */}
              <TouchableOpacity onPress={() => router.push('/ForgotPasswordScreen')}>
              <Text style={GlobalStyles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>
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

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFEB3B',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  bannerText: {
    color: '#000',
    textAlign: 'center',
  },
});
