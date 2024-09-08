import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, Easing, Dimensions } from 'react-native';
import { Icon, Layout } from '@ui-kitten/components'; // Use Layout from UI Kitten
import { BlurView } from 'expo-blur'; // Use Expo Blur for the glass effect

const { width } = Dimensions.get('window'); // Get screen dimensions

export default function LoadingScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spin animation setup
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500, // Duration for one spin (adjustable)
        easing: Easing.linear,
        useNativeDriver: true, // Use native driver for better performance
      })
    ).start();
  }, [spinValue]);

  // Interpolating spinValue to rotate
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Layout style={styles.container}>
      {/* Blur effect for the glass effect background */}
      <BlurView intensity={800} tint="dark" style={StyleSheet.absoluteFill} />

      {/* Rotating eye icon */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Icon
          name="eye"
          pack="eva"
          style={{
            width: 0.2 * width, // Dynamic icon size (20% of screen width)
            height: 0.2 * width,
            tintColor: 'red', // Customize the color of the loader
          }}
        />
      </Animated.View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // Transparent background for the blur effect
  },
});
