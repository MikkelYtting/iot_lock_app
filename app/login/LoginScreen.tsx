import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, TouchableWithoutFeedback, Dimensions, Animated } from 'react-native';
import { Layout, Text, Input, Button, CheckBox, Icon, useTheme, IconProps } from '@ui-kitten/components';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useThemeToggle } from '../_layout';
import { FirebaseError } from 'firebase/app';
import { LinearGradient } from 'expo-linear-gradient';
import LoadingScreen from '../../components/LoadingScreen';
import FormValidation from '../../components/FormValidation';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const theme = useTheme();
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

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
      setEmail('Mytting1994@gmail.com');
      setPassword('123456');
    }

    loadRememberedUser();
  }, [fadeAnim]);

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
      await createUserWithEmailAndPassword(auth, email, password);
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

  const renderPasswordIcon = (props: IconProps) => (
    <TouchableWithoutFeedback onPress={() => setPasswordVisible(!passwordVisible)}>
      <Icon {...props} name={passwordVisible ? 'eye' : 'eye-off'} />
    </TouchableWithoutFeedback>
  );

  if (loading && showLoader) {
    return <LoadingScreen />;
  }

  return (
    <LinearGradient colors={['#0D0000', 'black', '#0D0000']} style={styles.background}>
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
            onChangeText={setPassword}
            style={styles.input}
            accessoryLeft={(props) => <Icon {...props} name="lock-outline" />}
          />
          {/* Form validation component */}
          <FormValidation email={email} password={password} isSigningUp={isSigningUp} />

          <View style={styles.rememberMeContainer}>
            <CheckBox checked={rememberMe} onChange={(nextChecked) => setRememberMe(nextChecked)}>
              Remember Me
            </CheckBox>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </View>
          <Button style={styles.loginButton} onPress={handleLogin}>
            LOGIN
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
