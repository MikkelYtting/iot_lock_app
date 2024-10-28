import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, Modal, Alert } from 'react-native';
import { Layout, Icon, CheckBox, Button, Tooltip } from '@ui-kitten/components';
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
  const [showPasteHint, setShowPasteHint] = useState(false);

  const maxAttempts = 10;
  const { newEmail, userEmail, isOriginalEmail, initialEntry } = useLocalSearchParams();
  const originalEmail = auth.currentUser?.email;

  const router = useRouter();

  useEffect(() => {
    console.log('Component mounted with originalEmail:', originalEmail);
  }, [originalEmail]);

  useEffect(() => {
    if (initialKeypadEntry && !isNavigatedFromVerification && initialEntry === 'true') {
      if (originalEmail) {
        Alert.alert(
          'Verification PIN Sent',
          `A verification PIN has been sent to your email: ${originalEmail}`
        );
        console.log('Verification PIN sent to:', originalEmail);
      } else {
        Alert.alert('Error', 'User email is not available. Please try again.');
        console.error('Original email is not available:', originalEmail);
      }
      setInitialKeypadEntry(false);
    }
  }, [initialKeypadEntry, originalEmail, isNavigatedFromVerification, initialEntry]);

  const handleInsertFromClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      console.log('Trying to insert from clipboard. Clipboard content:', clipboardContent);
      if (/^\d{5}$/.test(clipboardContent.trim())) {
        console.log('Valid 5-digit PIN detected from clipboard, setting pin state');
        setPin(clipboardContent.slice(0, pinLength)); // Replaces all existing numbers
        setClipboardPin(clipboardContent);
        setPromptedForPin(true);
        setShowPasteHint(false);
        console.log('Auto-submitting PIN after paste');
        submitPin();
      } else {
        console.log('Invalid PIN detected from clipboard:', clipboardContent);
        Alert.alert('No Valid PIN', 'Clipboard does not contain a valid 5-digit PIN.');
      }
    } catch (error) {
      console.error('Error reading clipboard:', error);
    }
  };

  const checkClipboard = async () => {
    try {
      const clipboardContent = await Clipboard.getString();
      console.log('Checking clipboard. Clipboard content:', clipboardContent);
      if (
        /^\d{5}$/.test(clipboardContent.trim()) &&
        clipboardContent !== clipboardPin &&
        !promptedForPin
      ) {
        console.log('New valid clipboard PIN detected. Storing as current clipboardPin');
        setClipboardPin(clipboardContent);
        setShowPasteHint(true);
      } else if (clipboardContent !== clipboardPin) {
        console.log('Clipboard content changed but not a valid PIN');
        setClipboardPin('');
        setPromptedForPin(false);
        setShowPasteHint(false);
      } else {
        console.log('No change in clipboard or still invalid');
      }
    } catch (error) {
      console.error('Error checking clipboard:', error);
    }
  };

  useEffect(() => {
    console.log('Setting up clipboard interval check');
    const clipboardInterval = setInterval(() => {
      console.log('Running clipboard interval check');
      checkClipboard();
    }, 3000);

    return () => {
      console.log('Clearing clipboard interval check');
      clearInterval(clipboardInterval);
    };
  }, [clipboardPin, promptedForPin]);

  const handleDigitPress = (digit: string) => {
    console.log('Digit pressed:', digit);
    if (pin.length < pinLength && attempts < maxAttempts) {
      console.log(`Appending digit ${digit} to PIN`);
      setPin((prev) => prev + digit);
    } else {
      console.log('Cannot add digit: PIN length or attempt limit reached');
    }
  };

  const handleBackspace = () => {
    console.log('Backspace pressed');
    if (attempts < maxAttempts) {
      console.log('Removing last digit from PIN');
      setPin((prev) => prev.slice(0, -1));
    } else {
      console.log('Cannot remove digit: attempt limit reached');
    }
  };

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
    console.log('Generated PIN:', generatedPin);

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

      console.log(`Stored generated PIN (${generatedPin}) in Firestore for user: ${user.uid}`);

      const emailResponse = await fetch(
        `https://europe-west1-iot-lock-982b9.cloudfunctions.net/sendEmail?to=${originalEmail}&pin=${generatedPin}`
      );

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      Alert.alert('PIN Sent', 'A new verification PIN has been sent to your email.');
      console.log('Email sent successfully to:', originalEmail);
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
    if (!user) {
      console.error('submitPin: User is not authenticated');
      return;
    }

    try {
      console.log('Verifying PIN for user:', user.uid);

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
      console.log('Time since PIN creation (seconds):', timeDiff / 1000);

      const oneMinute = 60 * 1000;
      if (pin === storedPin && timeDiff <= oneMinute) {
        console.log('PIN is correct and within the valid time window');
        setModalVisible(true);
        setActivationSent(true);

        await deleteDoc(pinDocRef);
        console.log('Deleted PIN document after successful verification');
      } else if (timeDiff > oneMinute) {
        console.log('PIN expired. Prompting user to request a new one.');
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
        console.log('Deleted expired PIN document');
      } else {
        Alert.alert('Error', 'Invalid PIN. Please try again.');
        console.log('Entered PIN is incorrect');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
    }
  };

  return (
    <Layout style={styles.container}>
      <Text style={styles.title}>PIN VERIFICATION</Text>

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

      {showPasteHint && (
        <Tooltip
          anchor={() => (
            <TouchableOpacity onPress={handleInsertFromClipboard} style={styles.pasteHintBox}>
              <Text style={styles.pasteHintText}>Paste</Text>
            </TouchableOpacity>
          )}
          visible={showPasteHint}
          onBackdropPress={() => setShowPasteHint(false)}
          style={styles.tooltipStyle}
        >
          <View />
        </Tooltip>
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
  pasteHintBox: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#444',
    borderRadius: 8,
    marginTop: 10,
  },
  pasteHintText: {
    color: '#ffffff',
    fontSize: 16,
    textAlign: 'center',
  },
  tooltipStyle: {
    backgroundColor: '#444',
    padding: 0,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
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
