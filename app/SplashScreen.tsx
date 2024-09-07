import React, { useEffect, useState, useRef } from 'react';
import { Animated, Easing, Dimensions, ImageBackground, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons'; // For the animated icon

const { width, height } = Dimensions.get('window'); // Get screen dimensions

export default function SplashScreen() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const router = useRouter();
  const fadeAnimSplash = useRef(new Animated.Value(1)).current; // Splash opacity
  const fadeAnimLogin = useRef(new Animated.Value(0)).current; // Login opacity
  const spinValue = useRef(new Animated.Value(0)).current; // Animated value for spinning

  useEffect(() => {
    // Start spin animation for cogwheel
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000, // Duration for one full spin (2 seconds)
        easing: Easing.linear, // Add this line to make the spin smooth
        useNativeDriver: true,
      })
    ).start();
  }, [spinValue]);

  // Interpolate the spin value for continuous spinning effect
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  useEffect(() => {
    const startTransition = async () => {
      await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate loading delay

      // Fade out splash screen and fade in login screen
      Animated.sequence([
        Animated.timing(fadeAnimSplash, {
          toValue: 0,
          duration: 1000, // Fade out splash screen
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimLogin, {
          toValue: 1,
          duration: 1000, // Fade in login screen
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsSplashVisible(false); // After animation, remove splash from view
        router.replace('/login/LoginScreen'); // Navigate to the login screen after splash
      });
    };

    startTransition();
  }, [fadeAnimSplash, fadeAnimLogin]);

  return (
    <ImageBackground
      source={require('../assets/images/SplashScreen.png')} // Update to the correct path of your image
      style={styles.backgroundImage}
      resizeMode="cover" // Ensure the image covers the screen proportionally
    >
      {isSplashVisible ? (
        // Splash screen animation
        <Animated.View style={[styles.splashContainer, { opacity: fadeAnimSplash }]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <FontAwesome name="cog" size={0.2 * width} color="grey" style={styles.icon} />
          </Animated.View>
        </Animated.View>
      ) : null}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  splashContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  icon: {
    marginBottom: 20,
  },
});
