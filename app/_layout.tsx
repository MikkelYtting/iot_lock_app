import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import 'react-native-reanimated';
import { ApplicationProvider, IconRegistry, Layout } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { customLightTheme } from '../themes/lightTheme';
import { customDarkTheme } from '../themes/darkTheme';
import SplashScreenComponent from './SplashScreen';
import AuthGuard from '../components/AuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage'; // Import AsyncStorage

// Context for theme toggle
const ThemeToggleContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Custom hook to use the theme toggle
export const useThemeToggle = () => useContext(ThemeToggleContext);

SplashScreen.preventAutoHideAsync(); // Prevent auto-hide of the splash screen

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode initially
  const [isSplashVisible, setIsSplashVisible] = useState(true); // Controls splash visibility
  const [isRootLayoutMounted, setIsRootLayoutMounted] = useState(false); // New: Track RootLayout mounting state
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Determine current theme based on `isDarkMode`
  const theme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? NavigationDarkTheme : NavigationDefaultTheme;

  // Function to toggle the theme
  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (__DEV__) {
      console.log("Theme toggled:", newTheme ? "Dark" : "Light");
    }
    // Save the theme preference in AsyncStorage
    await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
  };

  // Load theme preference and handle splash screen logic
  useEffect(() => {
    const prepareApp = async () => {
      try {
        if (__DEV__) console.log("Preparing app...");

        // Load the saved theme preference from AsyncStorage
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
          if (__DEV__) console.log("Loaded theme from AsyncStorage:", savedTheme);
        }

        if (__DEV__) {
          // Simulate a splash screen delay for development purposes
          console.log("Simulating splash delay...");
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Reduce delay for better UX
        }
      } catch (e) {
        if (__DEV__) {
          console.warn('Error loading theme preference:', e);
        }
      } finally {
        setIsRootLayoutMounted(true); // New: Mark RootLayout as mounted
        setIsSplashVisible(false); // Hide splash after preparation
        SplashScreen.hideAsync();
      }
    };

    if (loaded) {
      if (__DEV__) console.log("Fonts loaded");
      prepareApp(); // Run the preparation logic once fonts are loaded
    }
  }, [loaded]);

  // If splash screen is still visible, show it
  if (isSplashVisible) {
    return (
      <ApplicationProvider {...eva} theme={theme}>
        <SplashScreenComponent isRootLayoutMounted={isRootLayoutMounted} />
      </ApplicationProvider>
    );
  }

  // Log to check if the Slot is being rendered correctly
  if (__DEV__) {
    console.log("Rendering current route slot...");
  }

  // Render the application layout once the splash screen is hidden
  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ThemeToggleContext.Provider value={{ isDarkMode, toggleTheme }}>
        <ApplicationProvider {...eva} theme={theme}>
          <ThemeProvider value={navigationTheme}>
            <Layout style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
              <AuthGuard>
                <Slot /> {/* The routing slot will render the pages based on navigation */}
              </AuthGuard>
            </Layout>
          </ThemeProvider>
        </ApplicationProvider>
      </ThemeToggleContext.Provider>
    </>
  );
}
