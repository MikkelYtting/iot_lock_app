import React from 'react';
import { StyleSheet } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';

export default function SettingsScreen() {
  return (
    <Layout style={styles.container}>
      <Text category="h1">Settings</Text>
      {/* Add your settings UI components here */}
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
