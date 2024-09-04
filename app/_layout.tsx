import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import 'react-native-reanimated';
import { ApplicationProvider, IconRegistry, Layout } from '@ui-kitten/components';
import * as eva from '@eva-design/eva'; // Import Eva design system
import { EvaIconsPack } from '@ui-kitten/eva-icons'; // Import Eva Icons

import { customLightTheme } from '../themes/lightTheme';
import { customDarkTheme } from '../themes/darkTheme';

// Context for theme toggle
const ThemeToggleContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Custom hook to use the theme toggle
export const useThemeToggle = () => useContext(ThemeToggleContext);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false); // State for dark mode
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
    if (loaded) {
      SplashScreen.hideAsync(); // Hide splash screen once fonts are loaded
    }
  }, [loaded]);

  if (!loaded) {
    return null; // Return null while fonts are loading
  }

  return (
    <>
      {/* Register Eva Icons */}
      <IconRegistry icons={EvaIconsPack} />
      
      <ThemeToggleContext.Provider value={{ isDarkMode, toggleTheme }}>
        <ApplicationProvider {...eva} theme={theme}>
          <ThemeProvider value={navigationTheme}>
            <Layout style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
              <Stack>
                {/* Ensure login screen is registered correctly */}
                <Stack.Screen
                  name="login/LoginScreen" // Adjust path for your login screen
                  options={{ headerShown: false }} // Hide the header on login screen
                />
                {/* Tab layout for authenticated users */}
                <Stack.Screen
                  name="(tabs)" // Ensure this corresponds to your tab layout
                  options={{ headerShown: false }}
                />
                {/* Handle not-found screen */}
                <Stack.Screen name="+not-found" />
              </Stack>
            </Layout>
          </ThemeProvider>
        </ApplicationProvider>
      </ThemeToggleContext.Provider>
    </>
  );
}
