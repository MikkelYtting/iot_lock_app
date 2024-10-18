import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Layout, Icon, CheckBox, Button } from '@ui-kitten/components';
import Clipboard from '@react-native-clipboard/clipboard';
import { doc, getDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '../../../firebase';

const { width } = Dimensions.get('window');

interface PinVerificationScreenProps {
  onVerify: () => void;
  userEmail: string; // Pass the user's email as a prop
  isNavigatedFromVerification: boolean; // Track if the user came from the "Go to Keypad" button
}

export default function PinVerificationScreen({
  onVerify,
  userEmail,
  isNavigatedFromVerification,
}: PinVerificationScreenProps) {
  const [pin, setPin] = useState('');
  const pinLength = 5;
  const [attempts, setAttempts] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasAgreed, setHasAgreed] = useState(false); // Checkbox state
  const [isModalVisible, setModalVisible] = useState(false); // Modal visibility state
  const [initialKeypadEntry, setInitialKeypadEntry] = useState(true); // Flag for showing the message only once
  const maxAttempts = 10;

  // Display message only if the user did not come from the "Go to Keypad" button
  useEffect(() => {
    if (initialKeypadEntry && !isNavigatedFromVerification) {
      if (userEmail) {
        // Show the alert message box only on the first entry to the screen
        Alert.alert('Verification PIN Sent', `A verification PIN has been sent to your email: ${userEmail}`);
      } else {
        Alert.alert('Error', 'User email is not available.');
      }
      setInitialKeypadEntry(false); // Reset flag to avoid showing the message again
    }
  }, [initialKeypadEntry, userEmail, isNavigatedFromVerification]);

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

  const sendVerificationPin = async () => {
    const user = auth.currentUser;
    if (!user) {
        Alert.alert('Error', 'User is not authenticated.');
        return;
    }

    const generatedPin = Math.floor(10000 + Math.random() * 90000).toString(); // Ensure it's a 5-digit PIN

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
        `https://europe-west1-iot-lock-982b9.cloudfunctions.net/sendEmail?to=${userEmail}&pin=${generatedPin}`
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

  const submitPin = async () => {
    const user = auth.currentUser;
    if (!user) return;

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

      const createdAtDate = createdAt.toDate(); // Convert Firestore timestamp to JS Date
      const timeDiff = now.getTime() - createdAtDate.getTime();

      console.log('Stored PIN:', storedPin, 'Entered PIN:', pin);
      console.log('Time since PIN creation:', timeDiff / 1000, 'seconds');

      // Check if the stored PIN is within the expiration time (1 minute)
      const oneMinute = 60 * 1000;
      if (pin === storedPin && timeDiff <= oneMinute) {
        setModalVisible(true); // Show modal instead of Alert

        await deleteDoc(pinDocRef); // Delete PIN after successful verification
      } else if (timeDiff > oneMinute) {
        // PIN has expired
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
                sendVerificationPin();  // Call sendVerificationPin to request a new PIN
              },
            },
          ],
          { cancelable: false }
        );
        await deleteDoc(pinDocRef); // Delete expired PIN
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

      <Text style={styles.instructions}>
        Check {userEmail} for the PIN code.
      </Text>

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

      {/* Modal for showing the checkbox and Log me out */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Please verify the email change on the new email.
            </Text>

            {/* Checkbox for Agreement */}
            <CheckBox
              checked={hasAgreed}
              onChange={setHasAgreed}
              style={styles.checkbox}
            >
              I understand that I need to click the verification link sent to my new email for the changes to take effect.
            </CheckBox>

            <Button
              onPress={() => {
                auth.signOut();
                setModalVisible(false); // Close modal after logout
              }}
              style={styles.logoutButton}
              disabled={!hasAgreed} // Disable the button until the checkbox is checked
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalText: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  checkbox: {
    marginVertical: 10,
  },
  logoutButton: {
    marginTop: 20,
    backgroundColor: 'red',
  },
});
