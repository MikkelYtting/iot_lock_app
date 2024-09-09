import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, Analytics, isSupported as isAnalyticsSupported } from 'firebase/analytics';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Firebase configuration setup
const firebaseConfig = {
  apiKey: Platform.OS === 'ios'
    ? Constants.manifest.extra.iosApiKey
    : Platform.OS === 'android'
    ? Constants.manifest.extra.androidApiKey
    : Constants.manifest.extra.webApiKey,
  authDomain: Constants.manifest.extra.authDomain,
  projectId: Constants.manifest.extra.projectId,
  storageBucket: Constants.manifest.extra.storageBucket,
  messagingSenderId: Constants.manifest.extra.messagingSenderId,
  appId: Platform.OS === 'ios'
    ? Constants.manifest.extra.iosAppId
    : Platform.OS === 'android'
    ? Constants.manifest.extra.androidAppId
    : Constants.manifest.extra.webAppId,
  measurementId: Constants.manifest.extra.measurementId,
};

console.log('Platform:', Platform.OS);
console.log('Firebase Config:', firebaseConfig);

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;
let analytics: Analytics | undefined;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  firestore = getFirestore(app);

  // Initialize GoogleAuthProvider
  const googleAuthProvider = new GoogleAuthProvider();

  isAnalyticsSupported().then((supported) => {
    if (Platform.OS !== 'web' && supported) {
      analytics = getAnalytics(app);
      console.log('Firebase Analytics initialized successfully');
    } else {
      console.log('Firebase Analytics not initialized');
    }
  });

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

export { auth, firestore, analytics, GoogleAuthProvider };
