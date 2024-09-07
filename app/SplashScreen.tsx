import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Layout, Text } from '@ui-kitten/components'; // Use UI Kitten components for consistency
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window'); // Get screen dimensions

export default function SplashScreen({ isRootLayoutMounted }: { isRootLayoutMounted: boolean }) {
  const fadeAnim = useRef(new Animated.Value(1)).current; // Opacity animation value for fade out
  const textFadeAnim = useRef(new Animated.Value(1)).current; // Separate animation for the text
  const router = useRouter();
  const [animationFinished, setAnimationFinished] = useState(false); // Track animation state

  useEffect(() => {
    if (isRootLayoutMounted) {
      // Delay to ensure root layout has mounted
      setTimeout(() => {
        // Start text fade-out animation
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 1500, // Fade out text over 1.5 seconds
          useNativeDriver: true,
        }).start(() => {
          // Start background fade-out animation after text has fully faded out
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 2000, // Fade out the entire screen over 2 seconds
            useNativeDriver: true,
          }).start(() => {
            setAnimationFinished(true); // Mark animation as complete
          });
        });
      }, 500); // Optional delay before starting the fade out
    }
  }, [isRootLayoutMounted, fadeAnim, textFadeAnim]);

  useEffect(() => {
    if (animationFinished) {
      // Wait for fade-out animation to complete before navigating
      setTimeout(() => {
        router.replace('/login/LoginScreen');
      }, 200);
    }
  }, [animationFinished, router]);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={['rgba(178, 0, 0, 0.3)', 'black', 'rgba(178, 0, 0, 0.3)']} // Subtle red gradient
        style={styles.background}
      >
        <Animated.View style={{ opacity: textFadeAnim }}>
          <Text category="h1" style={styles.text}>
            Argus Locks
          </Text>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  text: {
    fontSize: width * 0.12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
