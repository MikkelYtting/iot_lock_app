import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Use expo-linear-gradient
import { useRouter } from 'expo-router';
import { customDarkTheme as theme } from '../themes/darkTheme';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for cogwheel icon

export default function SplashScreen() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const spinValue = useRef(new Animated.Value(0)).current; // Animated value for spinning

  useEffect(() => {
    // Spin animation setup
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000, // Duration for one full spin (2 seconds)
        easing: Easing.linear, // Linear easing for constant speed
        useNativeDriver: true, // Use native driver for better performance
      })
    ).start();
  }, [spinValue]);

  // Spin animation interpolation
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const prepareApp = async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate a loading delay
      setIsReady(true);
    };

    prepareApp();
  }, []);

  useEffect(() => {
    if (isReady) {
      router.replace('/login/LoginScreen');
    }
  }, [isReady, router]);

  return (
    <LinearGradient
      colors={['#FF0000', '#808080', '#000000']} // Red, Grey, Black gradient
      locations={[0.3, 0.6, 1]} // Adjust the breakpoints between colors
      style={styles.container}
    >
      {/* Animated spinning cogwheel */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <FontAwesome name="cog" size={80} color="grey" style={styles.icon} /> 
      </Animated.View>

      <Text style={styles.logo}>ArgusLocks</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme['text-basic-color'], // White text for the logo
    marginTop: 20, // Add space between the cogwheel and the text
  },
  icon: {
    marginBottom: 20, // Space between the icon and the logo
  },
});
