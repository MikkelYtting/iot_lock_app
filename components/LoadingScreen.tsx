import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Icon } from '@ui-kitten/components'; // Import the Icon component

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
    <View style={styles.container}>
      {/* Rotating eye icon */}
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Icon
          name="eye"
          pack="eva"
          style={{
            width: 80,
            height: 80,
            tintColor: 'red',
          }}
        />
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
