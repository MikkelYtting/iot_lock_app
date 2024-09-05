import React from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import { Layout, Text } from '@ui-kitten/components';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

export default function HomeScreen() {
  return (
    <Layout style={styles.container}>
      <Text category="h1" style={styles.title}>Home Screen</Text>
      <Text style={styles.text}>Welcome to the home screen!</Text>
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
    fontSize: 0.07 * width, // 7% of screen width for title font size
    marginBottom: 20,
  },
  text: {
    fontSize: 0.05 * width, // 5% of screen width for text font size
  },
});
