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
import * as eva from '@eva-design/eva'; // Import Eva design system
import { EvaIconsPack } from '@ui-kitten/eva-icons'; // Import Eva Icons

import { customLightTheme } from '../themes/lightTheme';
import { customDarkTheme } from '../themes/darkTheme';
import SplashScreenComponent from './SplashScreen'; // Import the custom SplashScreen component
import AuthGuard from '../components/AuthGuard'; // Import your AuthGuard component

// Context for theme toggle
const ThemeToggleContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Custom hook to use the theme toggle
export const useThemeToggle = () => useContext(ThemeToggleContext);

// Prevent the splash screen from automatically hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true); // State for dark mode
  const [isSplashVisible, setIsSplashVisible] = useState(true); // State for splash visibility
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'), // Load custom fonts
  });

  // Choose the theme based on dark mode state
  const theme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? NavigationDarkTheme : NavigationDefaultTheme;

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode); // Function to toggle dark mode
  };

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Simulate loading tasks (e.g., API calls, loading assets, etc.) if in development mode
        if (__DEV__) {
          await new Promise(resolve => setTimeout(resolve, 3000)); // Simulating a 3-second delay in dev mode
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsSplashVisible(false); // Hide the splash screen after the delay
        SplashScreen.hideAsync(); // Hide the splash screen once the app is ready
      }
    };

    if (loaded) {
      prepareApp();
    }
  }, [loaded]);

  // Render the splash screen while it's visible
  if (isSplashVisible) {
    return <SplashScreenComponent />;
  }

  return (
    <>
      {/* Register Eva Icons */}
      <IconRegistry icons={EvaIconsPack} /> {/* Ensure icons are globally available */}
      
      <ThemeToggleContext.Provider value={{ isDarkMode, toggleTheme }}>
        <ApplicationProvider {...eva} theme={theme}>
          <ThemeProvider value={navigationTheme}>
            <Layout style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
              {/* Wrap the children inside AuthGuard */}
              <AuthGuard>
                <Slot /> {/* This is where all your child routes will be rendered */}
              </AuthGuard>
            </Layout>
          </ThemeProvider>
        </ApplicationProvider>
      </ThemeToggleContext.Provider>
    </>
  );
}
