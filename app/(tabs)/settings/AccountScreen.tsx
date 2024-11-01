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
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { validateEmail } from '../../../components/LoginScreenComponents/FormValidation';
import { getFunctions, httpsCallable } from 'firebase/functions';

const { width } = Dimensions.get('window');

const isDeveloperMode = __DEV__;
const PIN_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

const devLog = (...args: any[]): void => {
  if (__DEV__) {
    console.log(...args);
  }
};

interface SendPinCodeResponse {
  message: string;
  status: string;
}

export default function AccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{ name: string; newEmail: string; password: string }>({
    name: '',
    newEmail: '',
    password: '',
  });
  const [emailVerified, setEmailVerified] = useState(true);
  const [isPinSent, setIsPinSent] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const router = useRouter();
  const [pinGeneratedTime, setPinGeneratedTime] = useState<number | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      devLog('Authenticated User ID:', user.uid);
      devLog('User fetched in useEffect:', user);
      setName(user.displayName || '');
      setEmail(user.email || '');
      setIsEmailValid(true);

      if (isDeveloperMode) {
        setNewEmail('Mytting1994@gmail.com');
        setPassword('123456HH');
      }
    }

    const fetchProfile = async () => {
      try {
        if (!user) {
          devLog('No authenticated user found during fetchProfile');
          return;
        }

        const userDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (userDoc.exists()) {
          const profileData = userDoc.data();
          setName(profileData?.name || '');
          setEmail(profileData?.email || '');
          setEmailVerified(profileData?.emailVerified || false);
          devLog('Email fetched from Firestore profile:', profileData?.email);
        }
      } catch (error) {
        devLog('Error fetching user profile:', error instanceof Error ? error.message : error);
      }
    };

    if (user) {
      fetchProfile();
      refreshEmailVerificationStatus();
    }
  }, []);

  const refreshEmailVerificationStatus = async (): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      devLog('Refreshing email verification status for User ID:', user.uid);
      try {
        await user.reload();
        const isEmailVerified = user.emailVerified;
        setEmailVerified(isEmailVerified);
        await updateDoc(doc(firestore, 'users', user.uid), { emailVerified: isEmailVerified });
        devLog('Email verification status refreshed:', isEmailVerified);
      } catch (error) {
        devLog('Error refreshing email verification status:', error instanceof Error ? error.message : error);
      }
    }
  };

  const validateInputs = (): boolean => {
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
    devLog('Input validation result:', isValid, 'Errors:', newErrors);
    return isValid;
  };

  const handleNameChange = async (): Promise<void> => {
    if (!validateInputs()) return;

    try {
      const user = auth.currentUser;
      if (user && name !== user.displayName) {
        devLog('Updating name for User ID:', user.uid);
        await updateProfile(user, { displayName: name });
        await setDoc(doc(firestore, 'users', user.uid), { name }, { merge: true });
        Alert.alert('Success', 'Name updated successfully.');
        devLog('Name updated successfully');
      } else {
        Alert.alert('Error', 'Name has not been changed.');
      }
    } catch (error) {
      devLog('Error updating name:', error instanceof Error ? error.message : error);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  const reauthenticateUser = async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user || !password) return false;

    try {
      devLog('Reauthenticating user with email:', user.email);
      const credential = EmailAuthProvider.credential(user.email!, password);
      await reauthenticateWithCredential(user, credential);
      devLog('User reauthenticated successfully');
      return true;
    } catch (error) {
      devLog('Error reauthenticating user:', error instanceof Error ? error.message : error);
      Alert.alert('Authentication Failed', 'The provided password is incorrect. Please try again.');
      return false;
    }
  };

  const checkActivePin = async (): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    devLog('Checking active PIN for User ID:', user.uid);
    const pinDocRef = doc(firestore, 'pins', user.uid);
    const pinDoc = await getDoc(pinDocRef);

    if (pinDoc.exists()) {
      const { expiresAt } = pinDoc.data();
      const now = Date.now();
      devLog('PIN expiresAt:', expiresAt?.toMillis(), 'Current time:', now);

      if (expiresAt && now < expiresAt.toMillis()) {
        devLog('Active PIN found for User ID:', user.uid);
        return true;
      } else {
        devLog('PIN expired or invalid for User ID:', user.uid);
      }
    } else {
      devLog('No PIN document found for User ID:', user.uid);
    }
    return false;
  };

  const sendVerificationPin = async (): Promise<void> => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'User is not authenticated.');
      devLog('Error: No authenticated user');
      return;
    }

    devLog('Attempting to send verification PIN for User ID:', user.uid);

    const isReauthenticated = await reauthenticateUser();
    if (!isReauthenticated) {
      devLog('Error: Reauthentication failed');
      return;
    }

    const userEmail = user.email;
    if (!userEmail) {
      Alert.alert('Error', 'Email is not available.');
      devLog('Error: Email is undefined or empty.');
      return;
    }

    if (!isEmailValid || !newEmail) {
      Alert.alert('Error', 'Please enter a valid new email before requesting a PIN.');
      devLog('Error: Email is invalid or new email is missing.');
      return;
    }

    const hasActivePin = await checkActivePin();
    if (hasActivePin) {
      Alert.alert('Active PIN', 'You already have a valid PIN. Please use the existing PIN instead of requesting a new one.');
      return;
    }

    try {
      devLog('Attempting to call sendPinCodeEmail function');
      const functions = getFunctions(undefined, 'europe-west1');
      const sendPinCodeEmail = httpsCallable(functions, 'sendPinCodeEmail');

      const response = (await sendPinCodeEmail({ email: userEmail })) as { data: SendPinCodeResponse };
      devLog('sendPinCodeEmail function response:', response);

      setIsPinSent(true);

      router.push({
        pathname: '/(tabs)/settings/PinVerificationScreen',
        params: { userEmail, isOriginalEmail: 'true', initialEntry: 'true', newEmail },
      });
    } catch (error) {
      devLog('Error sending PIN:', error instanceof Error ? error.message : error);
      Alert.alert('Error', 'Failed to send PIN. Please try again.');
    }
  };

  const handleEmailChange = async (): Promise<void> => {
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
      if (user && newEmail && isPinSent && isEmailValid) {
        devLog('Changing email for User ID:', user.uid);
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
        setIsPinSent(false);
        devLog('Email change successful');
      } else {
        Alert.alert('Error', 'PIN verification and valid email are required before changing your email.');
      }
    } catch (error) {
      devLog('Error updating email:', error instanceof Error ? error.message : error);
      Alert.alert('Error', `Failed to update email: ${error instanceof Error ? error.message : error}`);
    }
  };

  const handleGoBackToKeypad = async (): Promise<void> => {
    const hasActivePin = await checkActivePin();
    if (hasActivePin) {
      router.push({
        pathname: '/(tabs)/settings/PinVerificationScreen',
        params: { userEmail: email, isOriginalEmail: 'true', initialEntry: 'false', newEmail },
      });
    } else {
      Alert.alert(
        'No Active PIN',
        'No active PIN found. Please send a new verification PIN.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send PIN',
            onPress: sendVerificationPin,
          },
        ]
      );
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
            <Button
              status="info"
              onPress={handleGoBackToKeypad}
              style={styles.button}
              disabled={!newEmail || !password || !isEmailValid}
            >
              Go back to keypad
            </Button>
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
