import { DarkTheme as NavigationDarkTheme, DefaultTheme as NavigationDefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, createContext, useContext } from 'react';
import 'react-native-reanimated';

import { ApplicationProvider, Layout } from '@ui-kitten/components';
import * as eva from '@eva-design/eva';

import { customLightTheme } from '../themes/lightTheme';
import { customDarkTheme } from '../themes/darkTheme';

const ThemeToggleContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

export const useThemeToggle = () => useContext(ThemeToggleContext);

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const theme = isDarkMode ? customDarkTheme : customLightTheme;
  const navigationTheme = isDarkMode ? NavigationDarkTheme : NavigationDefaultTheme;

  const toggleTheme = () => {
    setIsDarkMode((prevMode) => !prevMode);
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeToggleContext.Provider value={{ isDarkMode, toggleTheme }}>
      <ApplicationProvider {...eva} theme={theme}>
        <ThemeProvider value={navigationTheme}>
          <Layout style={{ flex: 1, backgroundColor: theme['background-basic-color-1'] }}>
            <Stack>
              <Stack.Screen
                name="index"
                options={{ headerShown: false }} // Always hide the header on the login screen
              />
              <Stack.Screen
                name="(tabs)"
                options={{ headerShown: false }} // Adjust this as needed for other screens
              />
              <Stack.Screen name="+not-found" />
            </Stack>
          </Layout>
        </ThemeProvider>
      </ApplicationProvider>
    </ThemeToggleContext.Provider>
  );
}
