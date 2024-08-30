import React from 'react';
import { Image, StyleSheet, Platform } from 'react-native';
import { Layout, Text, Button } from '@ui-kitten/components';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useThemeToggle } from '../_layout';



export default function HomeScreen() {
  const { isDarkMode, toggleTheme } = useThemeToggle(); // Access the global theme context

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/partial-react-logo.png')}
          style={styles.reactLogo}
        />
      }>
      <Layout style={styles.titleContainer}>
        <Text category="h1">Welcome!</Text>
        <HelloWave />
      </Layout>
      <Layout style={styles.stepContainer}>
        <Text category="h4">Step 1: Try it</Text>
        <Text>
          Edit <Text category="s1">app/(tabs)/index.tsx</Text> to see changes. Press{' '}
          <Text category="s1">
            {Platform.select({ ios: 'cmd + d', android: 'cmd + m' })}
          </Text>{' '}
          to open developer tools.
        </Text>
      </Layout>
      <Layout style={styles.stepContainer}>
        <Text category="h4">Step 2: Explore</Text>
        <Text>
          Tap the Explore tab to learn more about what's included in this starter app.
        </Text>
      </Layout>
      <Layout style={styles.stepContainer}>
        <Text category="h4">Step 3: Get a fresh start</Text>
        <Text>
          When you're ready, run{' '}
          <Text category="s1">npm run reset-project</Text> to get a fresh{' '}
          <Text category="s1">app</Text> directory. This will move the current{' '}
          <Text category="s1">app</Text> to{' '}
          <Text category="s1">app-example</Text>.
        </Text>
      </Layout>
      <Layout style={styles.stepContainer}>
        <Button onPress={toggleTheme}>
          {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        </Button>
      </Layout>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
