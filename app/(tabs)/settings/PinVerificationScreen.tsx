import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { Layout, Icon } from '@ui-kitten/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase';

const { width } = Dimensions.get('window');

interface PinVerificationScreenProps {
  onVerify: () => void;
  userEmail: string; // Pass the user's email as a prop
}

export default function PinVerificationScreen({ onVerify, userEmail }: PinVerificationScreenProps) {
  const [pin, setPin] = useState('');
  const pinLength = 5;
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const maxAttempts = 10;

  useEffect(() => {
    const checkClipboard = async () => {
      const clipboardContent = await Clipboard.getString();
      if (/^\d{5}$/.test(clipboardContent)) {
        Alert.alert(
          'Detected PIN',
          `A PIN was detected in your clipboard: ${clipboardContent}. Do you want to use it?`,
          [
            { text: 'No' },
            {
              text: 'Yes',
              onPress: () => setPin(clipboardContent.slice(0, pinLength)),
            },
          ]
        );
      }
    };
    checkClipboard();
  }, []);

  const handleDigitPress = (digit: string) => {
    if (pin.length < pinLength && attempts < maxAttempts) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    if (attempts < maxAttempts) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const submitPin = async () => {
    if (pin.length === pinLength && attempts < maxAttempts) {
      const userDocRef = doc(firestore, 'pins', userEmail); // Use the user's email to fetch the PIN
      const pinDoc = await getDoc(userDocRef);

      if (pinDoc.exists()) {
        const storedPin = pinDoc.data().pin;

        if (storedPin === pin) {
          Alert.alert(
            'Success',
            'PIN Verified Successfully! Please verify the email change on the new email.',
            [
              {
                text: 'Log me out',
                onPress: () => {
                  onVerify(); // Log the user out after successful verification
                  console.log('User logged out after PIN verification');
                },
              },
            ]
          );
          await deleteDoc(userDocRef); // Delete the PIN after successful verification
        } else {
          setAttempts(attempts + 1);
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

      <Text style={styles.instructions}>
        Check {userEmail} for the PIN code.
      </Text>

      <View style={styles.pinContainer}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinCircle,
              { borderColor: index < pin.length ? 'red' : 'gray' },
            ]}
          >
            {index < pin.length ? <View style={styles.filledCircle} /> : null}
          </View>
        ))}
      </View>

      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

      <View style={styles.keypadContainer}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <TouchableOpacity
            key={digit}
            style={styles.keypadButton}
            onPress={() => handleDigitPress(digit)}
            disabled={attempts >= maxAttempts}
          >
            <Text style={styles.keypadText}>{digit}</Text>
          </TouchableOpacity>
        ))}
        <View style={[styles.keypadButton, { backgroundColor: 'transparent' }]} />
        <TouchableOpacity
          style={styles.keypadButton}
          onPress={() => handleDigitPress('0')}
          disabled={attempts >= maxAttempts}
        >
          <Text style={styles.keypadText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.keypadButton}
          onPress={handleBackspace}
          disabled={attempts >= maxAttempts}
        >
          <Icon name="backspace-outline" pack="eva" style={styles.iconStyle} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.submitButton}
        onPress={submitPin}
        disabled={attempts >= maxAttempts}
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
  instructions: {
    color: '#ffffff',
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 16,
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
    width: width * 0.6,
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
    textAlign: 'center',
  },
});
