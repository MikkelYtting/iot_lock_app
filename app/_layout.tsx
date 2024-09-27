import {
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState, createContext, useContext } from 'react';
import 'react-native-reanimated';
import { ApplicationProvider, IconRegistry, Layout, Text } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';
import { EvaIconsPack } from '@ui-kitten/eva-icons';
import { customLightTheme } from '../themes/lightTheme';
import { customDarkTheme } from '../themes/darkTheme';
import SplashScreenComponent from './SplashScreen';
import AuthGuard from '../components/AuthGuard';
import AsyncStorage from '@react-native-async-storage/async-storage';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Layout style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'red' }}>An error occurred: {this.state.error?.message}</Text>
        </Layout>
      );
    }
    return this.props.children;
  }
}

// Context for theme toggle
const ThemeToggleContext = createContext({
  isDarkMode: false,
  toggleTheme: () => { },
});

export const useThemeToggle = () => useContext(ThemeToggleContext);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isRootLayoutMounted, setIsRootLayoutMounted] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const theme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? NavigationDarkTheme : NavigationDefaultTheme;

  const toggleTheme = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (__DEV__) {
      console.log("Theme toggled:", newTheme ? "Dark" : "Light");
    }
    await AsyncStorage.setItem('themePreference', newTheme ? 'dark' : 'light');
  };

  useEffect(() => {
    const prepareApp = async () => {
      try {
        if (__DEV__) console.log("Preparing app...");
        const savedTheme = await AsyncStorage.getItem('themePreference');
        if (savedTheme !== null) {
          setIsDarkMode(savedTheme === 'dark');
          if (__DEV__) console.log("Loaded theme from AsyncStorage:", savedTheme);
        }

        if (__DEV__) {
          console.log("Simulating splash delay...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (e) {
        if (__DEV__) {
          console.warn('Error loading theme preference:', e);
        }
      } finally {
        setIsRootLayoutMounted(true);
        setIsSplashVisible(false);
        SplashScreen.hideAsync();
      }
    };

    if (loaded) {
      if (__DEV__) console.log("Fonts loaded");
      prepareApp();
    }
  }, [loaded]);

  // Updated Debugging Function
  const debugRenderSlot = (children: React.ReactNode) => {
    return React.Children.map(children, (child, index) => {
      if (__DEV__) {
        if (child === null || child === undefined) {
          console.warn(`Child at index ${index} is null or undefined.`);
        } else if (typeof child === 'string') {
          console.error(`Detected raw string child at index ${index}: "${child}".`);
        } else if (React.isValidElement(child)) {
          const type = child.type;
          let typeName = "unknown";

          // Safely access displayName or name only if type is an object
          if (typeof type === 'object' && type !== null) {
            typeName = (type as any).displayName || (type as any).name || "unknown";
          } else if (typeof type === 'function') {
            typeName = type.name || "unknown";
          } else if (typeof type === 'string') {
            typeName = type;
          }

          console.log(`Rendering child component of type: ${typeName} with key: ${child?.key}`);
        }
      }
      return child;
    });
  };

  if (isSplashVisible) {
    return (
      <ApplicationProvider {...eva} theme={theme}>
        <SplashScreenComponent isRootLayoutMounted={isRootLayoutMounted} />
      </ApplicationProvider>
    );
  }

  if (__DEV__) {
    console.log("Rendering current route slot...");
  }

  return (
    <ErrorBoundary>
      <IconRegistry icons={EvaIconsPack} />
      <ThemeToggleContext.Provider value={{ isDarkMode, toggleTheme }}>
        <ApplicationProvider {...eva} theme={theme}>
          <ThemeProvider value={navigationTheme}>
            <Layout style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
              <AuthGuard>
                {debugRenderSlot(<Slot />)}
              </AuthGuard>
            </Layout>
          </ThemeProvider>
        </ApplicationProvider>
      </ThemeToggleContext.Provider>
    </ErrorBoundary>
  );
}
