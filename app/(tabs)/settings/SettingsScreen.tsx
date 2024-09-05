import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Layout, Text, Button } from '@ui-kitten/components';
import { useThemeToggle } from '../../_layout';
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth } from '../../../firebase';

const { width } = Dimensions.get('window'); // Get screen dimensions

export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth); // Sign out from Firebase
      await AsyncStorage.removeItem('user'); // Clear user session from AsyncStorage
      router.replace('/login/LoginScreen'); // Redirect to login screen after logout
    } catch (error) {
      console.log('Error signing out: ', error);
    }
  };

  return (
    <Layout style={styles.container}>
      <Text category="h1" style={styles.title}>Settings</Text>

      {/* Theme toggle button */}
      <Button onPress={toggleTheme} style={styles.button}>
        {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      </Button>

      {/* Logout button */}
      <Button status="danger" onPress={handleLogout} style={styles.button}>
        Logout
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0.05 * width, // 5% padding from the screen width
  },
  title: {
    fontSize: 0.07 * width, // Responsive title font size (7% of screen width)
    marginBottom: 20,
  },
  button: {
    marginVertical: 10,
    width: '80%',
    paddingVertical: 0.015 * width, // Responsive button padding (1.5% of screen width)
  },
});
