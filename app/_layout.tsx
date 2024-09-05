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

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode initially
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const theme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? NavigationDarkTheme : NavigationDefaultTheme;

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    // Save the theme in AsyncStorage
    await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const prepareApp = async () => {
      try {
        // Load the theme preference from AsyncStorage
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
        }

        if (__DEV__) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setIsSplashVisible(false);
        SplashScreen.hideAsync();
      }
    };

    if (loaded) {
      prepareApp();
    }
  }, [loaded]);

  if (isSplashVisible) {
    return <SplashScreenComponent />;
  }

  return (
    <>
      <IconRegistry icons={EvaIconsPack} />
      <ThemeToggleContext.Provider value={{ isDarkMode, toggleTheme }}>
        <ApplicationProvider {...eva} theme={theme}>
          <ThemeProvider value={navigationTheme}>
            <Layout style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
              <AuthGuard>
                <Slot />
              </AuthGuard>
            </Layout>
          </ThemeProvider>
        </ApplicationProvider>
      </ThemeToggleContext.Provider>
    </>
  );
}
