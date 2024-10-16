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
import { validateEmail, validatePassword } from '../../../components/LoginScreenComponents/FormValidation';

const { width } = Dimensions.get('window');

export default function AccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState(''); // Required for reauthentication
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({ name: '', newEmail: '', password: '' });
  const [emailVerified, setEmailVerified] = useState(true); // Track verification status only for email change
  const [pin, setPin] = useState(''); // PIN code for current email verification
  const [enteredPin, setEnteredPin] = useState(''); // User-entered PIN
  const [isPinVerified, setIsPinVerified] = useState(false); // Track if the PIN has been verified
  const [isPinSent, setIsPinSent] = useState(false); // Track if the PIN has been sent to the current email
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      console.log('Fetching user profile...');
      setName(user.displayName || '');
      setEmail(user.email || '');
    }

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user?.uid || ''));
        if (userDoc.exists()) {
          console.log('User profile found:', userDoc.data());
          setName(userDoc.data()?.name || '');
          setEmail(userDoc.data()?.email || '');
          setEmailVerified(userDoc.data()?.emailVerified || false);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user) {
      fetchProfile();
      refreshEmailVerificationStatus();
    }
  }, []);

  const refreshEmailVerificationStatus = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await user.reload();
        const isEmailVerified = user.emailVerified;
        setEmailVerified(isEmailVerified);
        console.log('Email verification status:', isEmailVerified);

        await updateDoc(doc(firestore, 'users', user.uid), { emailVerified: isEmailVerified });
      } catch (error) {
        console.error('Error refreshing email verification status:', error);
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
    if (isEditing && !validatePassword(password)) {
      newErrors.password = 'Password must meet the criteria.';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNameChange = async () => {
    if (!validateInputs()) return;

    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: name });
        await setDoc(
          doc(firestore, 'users', user.uid),
          { name },
          { merge: true }
        );

        Alert.alert('Success', 'Name updated successfully.');
        console.log('Name updated successfully for user:', user.uid);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error updating name:', error.message);
        Alert.alert('Error', 'Failed to update name. Please try again.');
      }
    }
  };

  const sendVerificationPin = async () => {
    const generatedPin = Math.floor(10000 + Math.random() * 90000).toString(); // Ensure it's a 5-digit PIN
    setPin(generatedPin);
    const user = auth.currentUser;

    try {
      // Store the PIN in Firestore under a separate collection, linked to the user ID
      const pinDocRef = doc(firestore, 'pins', user?.uid || ''); // Store by user UID
      await setDoc(pinDocRef, {
        pin: generatedPin,
        createdAt: new Date(), // Store the current timestamp for TTL
      });

      // Send the PIN via email
      const emailResponse = await fetch(
        `https://europe-west1-iot-lock-982b9.cloudfunctions.net/sendEmail?to=${email}&pin=${generatedPin}`
      );

      // Check if the response was successful
      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        throw new Error(`Failed to send email: ${errorText}`);
      }

      const responseText = await emailResponse.text(); // Parse as plain text
      console.log(responseText); // Log the response
      Alert.alert('Verification PIN Sent', `A verification PIN has been sent to your current email: ${email}`);
      setIsPinSent(true);
      // Update the navigation route
router.push({ pathname: '/(tabs)/settings/PinVerificationScreen', params: { userEmail: email } });

    } catch (error) {
      console.error('Error sending PIN:', error); // Log the error details
      Alert.alert('Error', 'Failed to send PIN. Please try again.');
    }
  };

  const verifyPin = async () => {
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
      const createdAtDate = createdAt.toDate(); // Convert Firestore timestamp to JS Date

      console.log('Stored PIN:', storedPin, 'Entered PIN:', enteredPin);
      console.log('Time since PIN creation:', (now.getTime() - createdAtDate.getTime()) / 1000, 'seconds');

      // Check if the stored PIN is within 1 minute of creation
      const timeDiff = now.getTime() - createdAtDate.getTime();
      const oneMinute = 60 * 1000;

      if (enteredPin === storedPin && timeDiff <= oneMinute) {
        setIsPinVerified(true);
        Alert.alert('Success', 'PIN verified! Please verify the email change on the new email.', [
          {
            text: 'Log me out',
            onPress: () => {
              auth.signOut();
              console.log('User logged out after PIN verification');
            },
          },
        ]);
        await deleteDoc(pinDocRef);
      } else if (timeDiff > oneMinute) {
        Alert.alert('Error', 'PIN has expired. Please request a new PIN.');
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

  const handleEmailChange = async () => {
    if (!validateInputs()) return;

    try {
      const user = auth.currentUser;
      if (user && newEmail && isPinVerified) {
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);

        await updateEmail(user, newEmail);
        await sendEmailVerification(user);
        setEmailVerified(false);

        Alert.alert(
          'Success',
          'Email updated! Please check your new email address to complete verification.'
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
        console.log('Email updated for user:', user.uid);
      } else {
        Alert.alert('Error', 'PIN verification is required before changing your email.');
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error updating email:', error.message);
        Alert.alert('Error', `Failed to update email. ${error.message}`);
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
      <Button onPress={handleNameChange} style={styles.button}>
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
            }}
            style={styles.input}
            status={errors.newEmail ? 'danger' : 'basic'}
            caption={errors.newEmail}
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
            <Button status="primary" onPress={sendVerificationPin} style={styles.button}>
              Send PIN to Current Email
            </Button>
          ) : (
            <>
              <Input
                placeholder="Enter PIN"
                value={enteredPin}
                onChangeText={setEnteredPin}
                style={styles.input}
              />
              <Button status="info" onPress={verifyPin} style={styles.button}>
                Verify PIN
              </Button>
            </>
          )}

          <Button status="primary" onPress={handleEmailChange} style={styles.button}>
            Confirm Email Change
          </Button>
        </>
      ) : (
        <Button status="warning" onPress={() => setIsEditing(true)} style={styles.button}>
          Edit Email
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
