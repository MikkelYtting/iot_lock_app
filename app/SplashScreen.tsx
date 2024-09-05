import React, { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient'; // Use expo-linear-gradient
import { useRouter } from 'expo-router';
import { customDarkTheme as theme } from '../themes/darkTheme';
import { FontAwesome } from '@expo/vector-icons'; // Import FontAwesome for cogwheel icon

const { width } = Dimensions.get('window'); // Get screen dimensions

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
        <FontAwesome name="cog" size={0.2 * width} color="grey" style={styles.icon} /> 
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
    fontSize: 0.12 * width, // Dynamic font size for logo (12% of screen width)
    fontWeight: 'bold',
    color: theme['text-basic-color'],
    marginTop: 20,
  },
  icon: {
    marginBottom: 20,
  },
});
