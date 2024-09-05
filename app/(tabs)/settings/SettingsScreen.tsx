import React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Button } from '@ui-kitten/components';
import { useThemeToggle } from '../../_layout';  // Adjust the relative path
import { signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { auth } from '../../../firebase';

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
      <Text category="h1">Settings</Text>

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
    backgroundColor: 'background-basic-color-1',
  },
  button: {
    marginVertical: 10,
    width: '80%',
  },
});
