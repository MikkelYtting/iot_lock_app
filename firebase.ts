import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

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

// Safely access the extra values by casting Constants.manifest.extra
const manifest = Constants.manifest as { extra: Extra } | null;

if (!manifest?.extra) {
  throw new Error('Manifest or extra config is missing!');
}

// Firebase configuration setup
const firebaseConfig = {
  apiKey: Platform.OS === 'ios'
    ? manifest.extra.iosApiKey
    : Platform.OS === 'android'
    ? manifest.extra.androidApiKey
    : manifest.extra.webApiKey,
  authDomain: manifest.extra.authDomain,
  projectId: manifest.extra.projectId,
  storageBucket: manifest.extra.storageBucket,
  messagingSenderId: manifest.extra.messagingSenderId,
  appId: Platform.OS === 'ios'
    ? manifest.extra.iosAppId
    : Platform.OS === 'android'
    ? manifest.extra.androidAppId
    : manifest.extra.webAppId,
  measurementId: manifest.extra.measurementId,
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let analytics: Analytics | undefined;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
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
