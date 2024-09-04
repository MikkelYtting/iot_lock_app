import React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text, Button } from '@ui-kitten/components';
import { useThemeToggle } from '../../_layout';  // Adjust the relative path



export default function SettingsScreen() {
  const { isDarkMode, toggleTheme } = useThemeToggle();

  return (
    <Layout style={styles.container}>
      <Text category="h1">Settings</Text>
      <Button onPress={toggleTheme}>
        {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      </Button>
      {/* Add your settings UI components here */}
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
});
