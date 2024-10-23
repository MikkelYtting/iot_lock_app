import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Dimensions } from 'react-native';
import { Button, Input, Text, Layout } from '@ui-kitten/components';
import { useRouter } from 'expo-router';
import {
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  sendEmailVerification,
} from 'firebase/auth';
import { auth, firestore } from '../../../firebase';
import { doc, setDoc, getDoc, updateDoc, deleteDoc, arrayUnion } from 'firebase/firestore';
import { validateEmail } from '../../../components/LoginScreenComponents/FormValidation';

const { width } = Dimensions.get('window');

const isDeveloperMode = __DEV__;

const PIN_EXPIRATION_TIME = 60 * 1000; // 1 minute in milliseconds
const MIN_PIN_AGE = 4000; // 4 seconds in milliseconds

export default function AccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState(''); // Required for reauthentication
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({ name: '', newEmail: '', password: '' });
  const [emailVerified, setEmailVerified] = useState(true);
  const [pin, setPin] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [isPinVerified, setIsPinVerified] = useState(false);
  const [isPinSent, setIsPinSent] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const router = useRouter();
  const [initialKeypadEntry, setInitialKeypadEntry] = useState(true); // Flag for showing the message only once

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      console.log('User fetched in useEffect:', user);
      setName(user.displayName || '');
      setEmail(user.email || '');
      setIsEmailValid(true);

      if (isDeveloperMode) {
        setNewEmail('Mytting1994@gmail.com');
        setPassword('123456HH');
      }
    } else {
      console.error('No authenticated user found during initial fetch');
    }

    const fetchProfile = async () => {
      try {
        if (!user) {
          console.error('No authenticated user found during fetchProfile');
          return;
        }

        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setName(profileData?.name || '');
          setEmail(profileData?.email || '');
          setEmailVerified(profileData?.emailVerified || false);

          console.log('Email fetched from Firestore profile:', profileData?.email);
        } else {
          console.error('User profile document does not exist');
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error fetching user profile:', error.message);
        } else {
          console.error('Unexpected error during fetchProfile', error);
        }
      }
    };

    if (user) {
      fetchProfile();
      refreshEmailVerificationStatus();
    }
  }, []);

  const checkActivePin = async () => {
    const user = auth.currentUser;
    if (!user) return null;

    const pinDocRef = doc(firestore, 'pins', user.uid);
    const pinDoc = await getDoc(pinDocRef);

    if (!pinDoc.exists()) {
      return null;
    }

    const { pin: storedPin, createdAt } = pinDoc.data();
    const now = new Date();

    if (!createdAt) return null;

    const createdAtDate = createdAt.toDate();
    const timeDiff = now.getTime() - createdAtDate.getTime();

    // If PIN is too new (less than 4 seconds), discard and send a new one
    if (timeDiff < MIN_PIN_AGE || timeDiff > PIN_EXPIRATION_TIME) {
      await deleteDoc(pinDocRef);
      return null;
    } else if (timeDiff >= MIN_PIN_AGE && timeDiff <= PIN_EXPIRATION_TIME) {
      return storedPin; // PIN is still valid
    }
  };

  const refreshEmailVerificationStatus = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await user.reload();
        const isEmailVerified = user.emailVerified;
        setEmailVerified(isEmailVerified);
        await updateDoc(doc(firestore, 'users', user.uid), { emailVerified: isEmailVerified });
      } catch (error) {
        if (error instanceof Error) {
          console.error('Error refreshing email verification status:', error.message);
        } else {
          console.error('Unexpected error during refreshEmailVerificationStatus', error);
        }
      }
    }
  };

  const validateInputs = () => {
    let isValid = true;
    const newErrors = { name: '', newEmail: '', password: '' };

    if (!name) {
      newErrors.name = 'Name cannot be empty.';
      isValid = false;
    }
    if (isEditing && !validateEmail(newEmail)) {
      newErrors.newEmail = 'Please enter a valid email.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNameChange = async () => {
    if (!validateInputs()) return;

    try {
      const user = auth.currentUser;
      if (user && name !== user.displayName) {
        await updateProfile(user, { displayName: name });
        await setDoc(doc(firestore, 'users', user.uid), { name }, { merge: true });
        Alert.alert('Success', 'Name updated successfully.');
      } else {
        Alert.alert('Error', 'Name has not been changed.');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating name:', error.message);
        Alert.alert('Error', 'Failed to update name. Please try again.');
      } else {
        console.error('Unexpected error during handleNameChange', error);
      }
    }
  };

  const reauthenticateUser = async () => {
    const user = auth.currentUser;
    if (!user || !password) return false;

    try {
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error reauthenticating user:', error.message);
        Alert.alert('Authentication Failed', 'The provided password is incorrect. Please try again.');
      }
      return false;
    }
  };

  const sendVerificationPin = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User is not authenticated.');
      return;
    }

    const isReauthenticated = await reauthenticateUser();
    if (!isReauthenticated) return;

    const userEmail = user.email; // Ensure the current authenticated user's email is used

    if (!isEmailValid || !newEmail) {
      Alert.alert('Error', 'Please enter a valid new email before requesting a PIN.');
      return;
    }

    try {
      const generatedPin = Math.floor(10000 + Math.random() * 90000).toString();
      setPin(generatedPin);

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

      router.push({ pathname: '/(tabs)/settings/PinVerificationScreen', params: { userEmail } });

      setIsPinSent(true);
      setEnteredPin('');
      setIsPinVerified(false);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error sending PIN:', error.message);
        Alert.alert('Error', 'Failed to send PIN. Please try again.');
      } else {
        console.error('Unexpected error during sendVerificationPin', error);
      }
    }
  };

  const verifyPin = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error('User is not authenticated');
      return;
    }

    try {
      const activePin = await checkActivePin();
      if (activePin) {
        Alert.alert('Verification PIN Sent', `Please check your email for the active PIN: ${newEmail}`, [
          {
            text: 'Go to Keypad',
            onPress: () => {
              router.push({ pathname: '/(tabs)/settings/PinVerificationScreen', params: { userEmail: newEmail } });
              setInitialKeypadEntry(false);
            },
          },
        ]);
        return;
      } else {
        await sendVerificationPin();
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error verifying PIN:', error.message);
        Alert.alert('Error', 'Failed to verify PIN. Please try again.');
      } else {
        console.error('Unexpected error during verifyPin', error);
      }
    }
  };

  const handleEmailChange = async () => {
    if (!validateInputs()) return;

    if (!password) {
      Alert.alert('Error', 'Password is required to change your email.');
      return;
    }

    if (!newEmail) {
      Alert.alert('Error', 'New email is required.');
      return;
    }

    try {
      const user = auth.currentUser;
      if (user && newEmail && isPinVerified && isEmailValid) {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);

        await updateEmail(user, newEmail);
        await sendEmailVerification(user);

        setEmailVerified(false);

        Alert.alert(
          'Success',
          `Email updated! Please check your new email address (${newEmail}) to complete verification.`
        );

        await updateDoc(doc(firestore, 'users', user.uid), {
          email: newEmail,
          emailVerified: false,
          emailHistory: arrayUnion(email),
        });

        setEmail(newEmail);
        setNewEmail('');
        setPassword('');
        setIsEditing(false);
        setIsPinVerified(false);
      } else {
        Alert.alert('Error', 'PIN verification and valid email are required before changing your email.');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating email:', error.message);
        Alert.alert('Error', `Failed to update email: ${error.message}`);
      } else {
        console.error('Unexpected error during handleEmailChange', error);
      }
    }
  };

  return (
    <Layout style={styles.container}>
      {!emailVerified && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Your email is not verified. Please check your inbox to complete the verification.
          </Text>
        </View>
      )}

      <Text category="label" style={styles.label}>
        Change Name
      </Text>
      <Input
        placeholder="Name"
        value={name}
        onChangeText={(val) => {
          setName(val);
          setErrors((prev) => ({ ...prev, name: '' }));
        }}
        style={styles.input}
        status={errors.name ? 'danger' : 'basic'}
        caption={errors.name}
      />
      <Button onPress={handleNameChange} style={styles.button} disabled={name === auth.currentUser?.displayName}>
        Update Name
      </Button>

      <Text category="label" style={styles.label}>
        Change Email
      </Text>
      <Input placeholder="Current Email" value={email} disabled style={styles.input} />

      {isEditing ? (
        <>
          <Input
            placeholder="New Email"
            value={newEmail}
            onChangeText={(val) => {
              setNewEmail(val);
              setErrors((prev) => ({ ...prev, newEmail: '' }));
              if (validateEmail(val)) {
                setIsEmailValid(true);
              } else {
                setIsEmailValid(false);
              }
            }}
            style={styles.input}
            status={!isEmailValid ? 'danger' : 'basic'}
            caption={!isEmailValid ? 'Invalid email format' : ''}
          />
          <Input
            placeholder="Current Password"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              setErrors((prev) => ({ ...prev, password: '' }));
            }}
            secureTextEntry
            style={styles.input}
            status={errors.password ? 'danger' : 'basic'}
            caption={errors.password}
          />

          {!isPinSent ? (
            <Button
              status="primary"
              onPress={sendVerificationPin}
              style={styles.button}
              disabled={!newEmail || !isEmailValid || !password}
            >
              Verify Email Change
            </Button>
          ) : (
            <>
              <Button
                status="info"
                onPress={verifyPin}
                style={styles.button}
                disabled={!newEmail || !password || !isEmailValid}
              >
                Verify PIN
              </Button>
            </>
          )}
        </>
      ) : (
        <Button status="warning" onPress={() => setIsEditing(true)} style={styles.button}>
          Change e-mail
        </Button>
      )}
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  banner: {
    backgroundColor: '#FFEB3B',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  bannerText: {
    color: '#000',
    textAlign: 'center',
  },
  label: {
    marginBottom: 5,
    fontSize: 16,
    color: '#8F9BB3',
  },
  input: {
    marginBottom: 15,
    borderColor: '#E4E9F2',
  },
  button: {
    marginVertical: 10,
  },
});
