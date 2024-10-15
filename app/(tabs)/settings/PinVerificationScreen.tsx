import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Layout, Icon } from '@ui-kitten/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';  // Adjust path to your firebase setup

const { width } = Dimensions.get('window');

// Define the type for the 'onVerify' function prop
interface PinVerificationScreenProps {
  onVerify: () => void; // Assuming 'onVerify' does not take any arguments and returns void
}

export default function PinVerificationScreen({ onVerify }: PinVerificationScreenProps) {
  const [pin, setPin] = useState(''); // Store the entered PIN
  const pinLength = 5; // Define the length of the PIN (5 digits)
  const [attempts, setAttempts] = useState(0); // Track the number of attempts
  const [errorMessage, setErrorMessage] = useState(''); // Error message for invalid PIN entry
  const maxAttempts = 10; // Max number of attempts

  useEffect(() => {
    // Check clipboard content for valid PIN on mount
    const checkClipboard = async () => {
      const clipboardContent = await Clipboard.getString();
      if (/^\d{4,5}$/.test(clipboardContent)) { // Check if clipboard content is 4 or 5 digits long
        Alert.alert(
          'Detected PIN',
          `A PIN was detected in your clipboard: ${clipboardContent}. Do you want to use it?`,
          [
            { text: 'No' },
            {
              text: 'Yes',
              onPress: () => setPin(clipboardContent.slice(0, pinLength)), // Use first 4-5 digits if more
            },
          ]
        );
      }
    };

    checkClipboard(); // Call the function on mount
  }, []);

  // Handle digit press
  const handleDigitPress = (digit: string) => {
    if (pin.length < pinLength && attempts < maxAttempts) {
      setPin((prev) => prev + digit); // Append the digit to the existing PIN
    }
  };

  // Handle backspace/delete
  const handleBackspace = () => {
    if (attempts < maxAttempts) {
      setPin((prev) => prev.slice(0, -1)); // Remove the last digit from the PIN
    }
  };

  // Submit the PIN
  const submitPin = async () => {
    if (pin.length === pinLength && attempts < maxAttempts) {
      // Fetch the stored PIN from Firestore
      const userDocRef = doc(firestore, 'pins', 'user-email@example.com'); // Replace with actual email/userId
      const pinDoc = await getDoc(userDocRef);

      if (pinDoc.exists()) {
        const storedPin = pinDoc.data().pin;

        if (storedPin === pin) {
          Alert.alert('Success', 'PIN Verified Successfully!');
          await deleteDoc(userDocRef); // Optionally delete the PIN after successful verification
          onVerify(); // Call the 'onVerify' prop after verification
        } else {
          setAttempts(attempts + 1); // Increment attempt counter
          setErrorMessage(`Incorrect PIN. Attempts remaining: ${maxAttempts - attempts - 1}`);
          if (attempts + 1 >= maxAttempts) {
            Alert.alert('Error', 'Too many incorrect attempts. Please try again later.');
          }
        }
      } else {
        Alert.alert('Error', 'No PIN found.');
      }
    } else {
      setErrorMessage('Please enter the full 5-digit PIN.');
    }
  };

  return (
    <Layout style={styles.container}>
      <Text style={styles.title}>PIN VERIFICATION</Text>

      {/* PIN Input Display */}
      <View style={styles.pinContainer}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinCircle,
              { borderColor: index < pin.length ? 'red' : 'gray' }, // Change color if digit is entered
            ]}
          >
            {index < pin.length ? <View style={styles.filledCircle} /> : null}
          </View>
        ))}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      {/* Custom Numeric Keypad */}
      <View style={styles.keypadContainer}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit, index) => (
          <TouchableOpacity
            key={index}
            style={styles.keypadButton}
            onPress={() => handleDigitPress(digit)}
            disabled={attempts >= maxAttempts} // Disable buttons after max attempts
          >
            <Text style={styles.keypadText}>{digit}</Text>
          </TouchableOpacity>
        ))}
        {/* Empty Space */}
        <View style={[styles.keypadButton, { backgroundColor: 'transparent' }]} />
        {/* '0' Button */}
        <TouchableOpacity style={styles.keypadButton} onPress={() => handleDigitPress('0')} disabled={attempts >= maxAttempts}>
          <Text style={styles.keypadText}>0</Text>
        </TouchableOpacity>
        {/* Backspace Button */}
        <TouchableOpacity style={styles.keypadButton} onPress={handleBackspace} disabled={attempts >= maxAttempts}>
          <Icon name="backspace-outline" pack="eva" style={styles.iconStyle} />
        </TouchableOpacity>
      </View>

      {/* Submit PIN Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={submitPin}
        disabled={attempts >= maxAttempts} // Disable submission after max attempts
      >
        <Text style={styles.submitButtonText}>Submit PIN</Text>
      </TouchableOpacity>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 30,
  },
  pinContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  pinCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'red',
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width * 0.6, // Set the keypad width dynamically
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButton: {
    width: '30%',
    padding: 15,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 5,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  keypadText: {
    fontSize: 24,
    color: '#ffffff',
  },
  iconStyle: {
    width: 24,
    height: 24,
    tintColor: 'red',
  },
  submitButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
  },
  errorText: {
    color: '#ff4d4d',
    marginBottom: 20,
  },
});
