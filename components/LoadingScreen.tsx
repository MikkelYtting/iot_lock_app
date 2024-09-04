import React, { useRef, useEffect } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { Icon, IconProps } from '@ui-kitten/components';  // Import IconProps

// Custom Eye Icon component
const EyeIcon = (props: IconProps) => (  // Explicitly type props as IconProps
  <Icon
    {...props}
    name="eye"
    pack="eva"
    style={{
      width: 80,
      height: 80,
      tintColor: 'red', // Red tint for the main part of the eye
    }}
  />
);

export default function LoadingScreen() {
  const spinValue = useRef(new Animated.Value(0)).current;

  // Setup animation for continuous rotation
  useEffect(() => {
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
    <View style={styles.container}>
      {/* Eye Icon with spinning animation */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <EyeIcon />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black', // Set the background to black
  },
});
