import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Layout, Icon, CheckBox, Button } from '@ui-kitten/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, firestore } from '../../../firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getFunctions, httpsCallable } from 'firebase/functions';
import * as CryptoJS from 'crypto-js';

const { width } = Dimensions.get('window');

interface PinVerificationScreenProps {
  onVerify: () => void;
  isNavigatedFromVerification: boolean;
}

interface SendPinCodeRequest {
  email: string;
}

interface SendPinCodeResponse {
  ttl: number; // `ttl` is expected to be a number representing time in milliseconds
}

export default function PinVerificationScreen({
  onVerify,
  isNavigatedFromVerification,
}: PinVerificationScreenProps) {
  const [pin, setPin] = useState('');
  const [pinGeneratedTime, setPinGeneratedTime] = useState<number | null>(null);
  const [pinTTL, setPinTTL] = useState<number>(60 * 1000); // Default TTL of 1 minute in milliseconds
  const pinLength = 5;
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [initialKeypadEntry, setInitialKeypadEntry] = useState(true);
  const [activationSent, setActivationSent] = useState(false);
  const [detectedNumber, setDetectedNumber] = useState<string | null>(null);

  const maxAttempts = 10;
  const { newEmail, userEmail, isOriginalEmail, initialEntry } = useLocalSearchParams();
  const originalEmail = auth.currentUser?.email;

  const router = useRouter();

  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (
      initialKeypadEntry &&
      !isNavigatedFromVerification &&
      initialEntry === 'true'
    ) {
      if (originalEmail) {
        Alert.alert(
          'Verification PIN Sent',
          `A verification PIN has been sent to your email: ${originalEmail}`
        );
      } else {
        Alert.alert('Error', 'User email is not available. Please try again.');
      }
      setInitialKeypadEntry(false);
    }
  }, [initialKeypadEntry, originalEmail, isNavigatedFromVerification, initialEntry]);

  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const clipboardContent = await Clipboard.getString();
        if (/^\d{5}$/.test(clipboardContent.trim())) {
          setDetectedNumber(clipboardContent.trim());
        } else {
          setDetectedNumber(null);
        }
      } catch (error) {
        console.error('Error reading clipboard:', error);
      }
    };

    const intervalId = setInterval(checkClipboard, 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (pin.length === pinLength && attempts < maxAttempts) {
      if (!hasSubmittedRef.current) {
        hasSubmittedRef.current = true;
        submitPin();
      }
    } else {
      hasSubmittedRef.current = false;
    }
  }, [pin]);

  const handleInsertFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      const trimmedContent = clipboardContent.trim();

      if (/^\d{1,5}$/.test(trimmedContent)) {
        setPin(trimmedContent.slice(0, pinLength));
      } else {
        Alert.alert('Invalid Input', 'Clipboard does not contain a valid number.');
      }
    } catch (error) {
      console.error('Error reading clipboard:', error);
    }
  };

  const handleHintPaste = () => {
    if (detectedNumber) {
      setPin(detectedNumber);
    }
  };

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

  const sendVerificationPin = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User is not authenticated.');
      return;
    }

    if (!originalEmail) {
      Alert.alert('Error', 'Email is not available. Please try again.');
      return;
    }

    try {
      const functions = getFunctions();
      const sendPinCodeEmail = httpsCallable<SendPinCodeRequest, SendPinCodeResponse>(functions, 'sendPinCodeEmail');
      const response = await sendPinCodeEmail({ email: originalEmail });

      if (response.data.ttl) {
        const ttl = response.data.ttl;
        setPinGeneratedTime(Date.now());
        setPinTTL(ttl);
      }

      Alert.alert('PIN Sent', 'A new verification PIN has been sent to your email.');
    } catch (error) {
      console.error('Error sending PIN:', error);
      Alert.alert('Error', 'Failed to send PIN. Please try again.');
    }
  };

  const submitPin = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const now = Date.now();
    if (pinGeneratedTime && pinTTL && now - pinGeneratedTime > pinTTL) {
      Alert.alert('PIN Expired', 'Your PIN has expired. Please request a new one.');
      return;
    }

    try {
      const pinDocRef = doc(firestore, 'pins', user.uid);
      const pinDoc = await getDoc(pinDocRef);

      if (!pinDoc.exists()) {
        Alert.alert('Error', 'No PIN found. Please request a new PIN.');
        return;
      }

      const { hashedPin } = pinDoc.data();
      const hashedEnteredPin = CryptoJS.SHA256(pin).toString();

      if (hashedEnteredPin === hashedPin) {
        setModalVisible(true);
        setActivationSent(true);
        await deleteDoc(pinDocRef);
      } else {
        setAttempts((prevAttempts) => prevAttempts + 1);
        Alert.alert('Error', 'Invalid PIN. Please try again.');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
    }
  };

  return (
    <Layout style={styles.container}>
      <Text style={styles.title}>PIN VERIFICATION</Text>

      <Text style={styles.instructions}>
        Check {originalEmail} for the PIN code.
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

      {detectedNumber && (
        <TouchableOpacity
          style={styles.pasteHintContainer}
          onPress={handleHintPaste}
        >
          <Text style={styles.pasteHintText}>Paste {detectedNumber}</Text>
        </TouchableOpacity>
      )}

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}

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

        <TouchableOpacity
          style={[styles.keypadButton, styles.insertButton]}
          onPress={handleInsertFromClipboard}
          disabled={attempts >= maxAttempts}
        >
          <Icon name="clipboard-outline" pack="eva" style={styles.iconStyle} />
        </TouchableOpacity>

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
        disabled={attempts >= maxAttempts || pin.length !== pinLength}
      >
        <Text style={styles.submitButtonText}>Submit PIN</Text>
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {activationSent ? (
              <Text style={styles.modalText}>
                An activation link has been sent to your new email address: {newEmail}.
              </Text>
            ) : (
              <Text style={styles.modalText}>
                Please verify the email change on the new email.
              </Text>
            )}

            <CheckBox
              checked={hasAgreed}
              onChange={(nextChecked) => setHasAgreed(nextChecked)}
              style={styles.checkbox}
            >
              I understand that I need to click the verification link sent to my new email for the changes to take effect.
            </CheckBox>

            <Button
              onPress={() => auth.signOut()}
              style={styles.logoutButton}
              disabled={!hasAgreed}
            >
              Log me out
            </Button>
          </View>
        </View>
      </Modal>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
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
    marginBottom: 20,
  },
  pinCircle: {
    width: width * 0.05,
    height: width * 0.05,
    borderRadius: (width * 0.05) / 2,
    borderWidth: 2,
    marginHorizontal: width * 0.02,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filledCircle: {
    width: width * 0.03,
    height: width * 0.03,
    borderRadius: (width * 0.03) / 2,
    backgroundColor: 'red',
  },
  pasteHintContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: '#444',
    borderRadius: 10,
  },
  pasteHintText: {
    color: '#ffffff',
    fontSize: 16,
  },
  keypadContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: width * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadButton: {
    width: '25%',
    paddingVertical: width * 0.03,
    justifyContent: 'center',
    alignItems: 'center',
    margin: width * 0.015,
    backgroundColor: '#333',
    borderRadius: 10,
  },
  insertButton: {
    backgroundColor: '#444',
  },
  keypadText: {
    fontSize: width * 0.06,
    color: '#ffffff',
  },
  iconStyle: {
    width: width * 0.07,
    height: width * 0.07,
    tintColor: '#ffffff',
  },
  submitButton: {
    backgroundColor: 'red',
    paddingVertical: width * 0.04,
    paddingHorizontal: width * 0.2,
    borderRadius: 10,
    marginTop: 30,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: width * 0.05,
  },
  errorText: {
    color: '#ff4d4d',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 25,
    alignItems: 'center',
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    marginBottom: 15,
    textAlign: 'center',
  },
  checkbox: {
    marginVertical: 10,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: 'red',
    borderColor: 'red',
  },
});
