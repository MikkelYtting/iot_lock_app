import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Layout, Icon, CheckBox, Button } from '@ui-kitten/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../../firebase';
import { useRouter, useLocalSearchParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

interface PinVerificationScreenProps {
  onVerify: () => void;
  isNavigatedFromVerification: boolean;
}

export default function PinVerificationScreen({
  onVerify,
  isNavigatedFromVerification,
}: PinVerificationScreenProps) {
  const [pin, setPin] = useState('');
  const pinLength = 5;
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [initialKeypadEntry, setInitialKeypadEntry] = useState(true);
  const [activationSent, setActivationSent] = useState(false);
  const [clipboardPin, setClipboardPin] = useState('');
  const [promptedForPin, setPromptedForPin] = useState(false);
  const [showPasteHint, setShowPasteHint] = useState(false); // State to show paste hint

  const maxAttempts = 10;
  const { newEmail, userEmail, isOriginalEmail, initialEntry } = useLocalSearchParams();
  const originalEmail = auth.currentUser?.email;

  const router = useRouter();

  // Log originalEmail on mount to debug its state
  useEffect(() => {
    console.log('PinVerificationScreen mounted with originalEmail:', originalEmail);
  }, [originalEmail]);

  // Show the alert only on the initial keypad entry
  useEffect(() => {
    if (initialKeypadEntry && !isNavigatedFromVerification && initialEntry === 'true') {
      if (originalEmail) {
        Alert.alert(
          'Verification PIN Sent',
          `A verification PIN has been sent to your email: ${originalEmail}`
        );
      } else {
        Alert.alert('Error', 'User email is not available. Please try again.');
        console.error('originalEmail is not available:', originalEmail);
      }
      setInitialKeypadEntry(false);
    }
  }, [initialKeypadEntry, originalEmail, isNavigatedFromVerification, initialEntry]);

  // Function to check clipboard content and insert PIN if valid
  const handleInsertFromClipboard = async () => {
    const clipboardContent = await Clipboard.getString();
    if (/^\d{5}$/.test(clipboardContent)) {
      setPin(clipboardContent.slice(0, pinLength));
      setClipboardPin(clipboardContent);
      setPromptedForPin(true);
      setShowPasteHint(false); // Hide hint after pasting
    } else {
      Alert.alert('No Valid PIN', 'Clipboard does not contain a valid 5-digit PIN.');
    }
  };

  // Function to check clipboard and show paste hint if a valid PIN is detected
  const checkClipboard = async () => {
    const clipboardContent = await Clipboard.getString();
    if (
      /^\d{5}$/.test(clipboardContent) &&
      clipboardContent !== clipboardPin &&
      !promptedForPin
    ) {
      setClipboardPin(clipboardContent);
      setShowPasteHint(true); // Show paste hint when a valid PIN is detected
    } else if (clipboardContent !== clipboardPin) {
      setClipboardPin('');
      setPromptedForPin(false);
      setShowPasteHint(false); // Hide hint if clipboard changes to an invalid PIN
    }
  };

  // Automatic clipboard check
  useEffect(() => {
    const clipboardInterval = setInterval(() => {
      checkClipboard();
    }, 3000); // Check every 3 seconds

    return () => clearInterval(clipboardInterval);
  }, [clipboardPin, promptedForPin]);

  // Handle digit press on the keypad
  const handleDigitPress = (digit: string) => {
    if (pin.length < pinLength && attempts < maxAttempts) {
      setPin((prev) => prev + digit);
    }
  };

  // Handle backspace press on the keypad
  const handleBackspace = () => {
    if (attempts < maxAttempts) {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  // Send a new verification PIN
  const sendVerificationPin = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User is not authenticated.');
      console.error('sendVerificationPin: No authenticated user found.');
      return;
    }

    if (!originalEmail) {
      Alert.alert('Error', 'Email is not available. Please try again.');
      console.error('sendVerificationPin called with missing originalEmail:', originalEmail);
      return;
    }

    const generatedPin = Math.floor(10000 + Math.random() * 90000).toString();

    try {
      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() + 1);

      const pinDocRef = doc(firestore, 'pins', user.uid);
      await setDoc(pinDocRef, {
        pin: generatedPin,
        createdAt: new Date(),
        ttl: expirationTime,
        userId: user.uid,
      });

      console.log(`PIN (${generatedPin}) stored in Firestore for user: ${user.uid}`);

      const emailResponse = await fetch(
        `https://europe-west1-iot-lock-982b9.cloudfunctions.net/sendEmail?to=${originalEmail}&pin=${generatedPin}`
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      Alert.alert('PIN Sent', 'A new verification PIN has been sent to your email.');
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error sending PIN:', error.message);
        Alert.alert('Error', 'Failed to send PIN. Please try again.');
      } else {
        console.error('Unexpected error', error);
      }
    }
  };

  // Submit the entered PIN for verification
  const submitPin = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error('submitPin: User is not authenticated');
      return;
    }

    try {
      console.log('Verifying PIN for user:', user.uid);

      // Fetch the stored PIN from Firestore
      const pinDocRef = doc(firestore, 'pins', user.uid);
      const pinDoc = await getDoc(pinDocRef);

      if (!pinDoc.exists()) {
        console.log('No PIN found in Firestore for user:', user.uid);
        Alert.alert('Error', 'No PIN found. Please request a new PIN.');
        return;
      }

      const { pin: storedPin, createdAt } = pinDoc.data();
      const now = new Date();

      if (!createdAt) {
        console.error('Error: createdAt field is missing from Firestore document');
        Alert.alert('Error', 'Invalid PIN document. Please request a new PIN.');
        return;
      }

      const createdAtDate = createdAt.toDate();
      const timeDiff = now.getTime() - createdAtDate.getTime();

      console.log('Stored PIN:', storedPin, 'Entered PIN:', pin);
      console.log('Time since PIN creation:', timeDiff / 1000, 'seconds');

      // Check if the stored PIN is within the expiration time (1 minute)
      const oneMinute = 60 * 1000;
      if (pin === storedPin && timeDiff <= oneMinute) {
        setModalVisible(true);
        setActivationSent(true);

        await deleteDoc(pinDocRef);
      } else if (timeDiff > oneMinute) {
        Alert.alert(
          'PIN Expired',
          'Your PIN has expired. Would you like to request a new one?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Request New PIN',
              onPress: () => {
                sendVerificationPin();
              },
            },
          ],
          { cancelable: false }
        );
        await deleteDoc(pinDocRef);
        console.log('PIN expired and deleted for user:', user.uid);
      } else {
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

      {/* Always show the original email in the instructions */}
      <Text style={styles.instructions}>Check {originalEmail} for the PIN code.</Text>

      <View style={styles.pinContainer}>
        {Array.from({ length: pinLength }).map((_, index) => (
          <View
            key={index}
            style={[styles.pinCircle, { borderColor: index < pin.length ? 'red' : 'gray' }]}
          >
            {index < pin.length ? <View style={styles.filledCircle} /> : null}
          </View>
        ))}
      </View>

      {/* Show Paste hint if a valid PIN is detected in clipboard */}
      {showPasteHint && (
        <TouchableOpacity onPress={handleInsertFromClipboard}>
          <Text style={styles.pasteHintText}>Paste</Text>
        </TouchableOpacity>
      )}

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

        {/* Insert Clipboard Button with Icon */}
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

      {/* Modal for showing the checkbox and Log me out */}
      <Modal
        visible={isModalVisible}
        transparent={true}
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
              <Text style={styles.modalText}>Please verify the email change on the new email.</Text>
            )}

            {/* Checkbox for Agreement */}
            <CheckBox checked={hasAgreed} onChange={setHasAgreed} style={styles.checkbox}>
              I understand that I need to click the verification link sent to my new email for the
              changes to take effect.
            </CheckBox>

            <Button
              onPress={() => {
                auth.signOut();
                setModalVisible(false);
              }}
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
  pasteHintText: {
    color: '#ffffff',
    fontSize: 16,
    marginVertical: 10,
    textAlign: 'center',
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
