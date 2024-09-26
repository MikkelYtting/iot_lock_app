import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  Auth,
  GoogleAuthProvider
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Define the type for the 'extra' field in the manifest
interface Extra {
  iosApiKey: string;
  androidApiKey: string;
  webApiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  iosAppId: string;
  androidAppId: string;
  webAppId: string;
  measurementId: string;
}

// Use Constants.expoConfig instead of Constants.manifest
const expoConfig = Constants.expoConfig as { extra: Extra } | null;

console.log('Expo Config:', expoConfig); // Check if expoConfig is loaded

if (!expoConfig?.extra) {
  throw new Error('Expo Config or extra config is missing!');
}

// Firebase configuration setup
const firebaseConfig = {
  apiKey: Platform.OS === 'ios'
    ? expoConfig.extra.iosApiKey
    : Platform.OS === 'android'
    ? expoConfig.extra.androidApiKey
    : expoConfig.extra.webApiKey,
  authDomain: expoConfig.extra.authDomain,
  projectId: expoConfig.extra.projectId,
  storageBucket: expoConfig.extra.storageBucket,
  messagingSenderId: expoConfig.extra.messagingSenderId,
  appId: Platform.OS === 'ios'
    ? expoConfig.extra.iosAppId
    : Platform.OS === 'android'
    ? expoConfig.extra.androidAppId
    : expoConfig.extra.webAppId,
  measurementId: expoConfig.extra.measurementId,
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let analytics: Analytics | undefined;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firebase Auth with React Native Persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  firestore = getFirestore(app);

  // Only initialize analytics if supported and not on the web platform
  isAnalyticsSupported().then((supported) => {
    if (Platform.OS !== 'web' && supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
    } else {
      console.log('Firebase Analytics not initialized (web platform or unsupported environment)');
    }
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Google OAuth configuration
const googleClientId = Platform.OS === 'ios'
  ? '797072839515-aq6pdq0m0s7tkm3p9ilmivh06h12odvo.apps.googleusercontent.com'  // iOS Client ID
  : Platform.OS === 'android'
  ? '797072839515-egu7u3imnns8kdq7bdtv93fkntvgq41t.apps.googleusercontent.com'  // Android Client ID
  : '797072839515-ro14b99rojjlha9jaq34un29ej0kia3s.apps.googleusercontent.com'; // Web Client ID

export { auth, firestore, GoogleAuthProvider, googleClientId };
