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
import { doc, setDoc, getDoc } from 'firebase/firestore';
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
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setName(user.displayName || '');
      setEmail(user.email || '');
    }

    // Fetch user profile from Firestore
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(firestore, 'users', user?.uid || ''));
        if (userDoc.exists()) {
          setName(userDoc.data()?.name || '');
          setEmail(userDoc.data()?.email || '');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    if (user) fetchProfile();
  }, []);

  // Validate inputs before proceeding
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

  // Update the user's name in both Auth and Firestore
  const handleNameChange = async () => {
    if (!validateInputs()) return;

    try {
      const user = auth.currentUser;
      if (user) {
        await updateProfile(user, { displayName: name });

        // Update the name in Firestore as well
        await setDoc(
          doc(firestore, 'users', user.uid),
          { name },
          { merge: true }
        );

        Alert.alert('Success', 'Name updated successfully.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.log('Error updating name:', errorMessage);
      Alert.alert('Error', 'Failed to update name. Please try again.');
    }
  };

  // Handle the user's email update
  const handleEmailChange = async () => {
    if (!validateInputs()) return;

    try {
      const user = auth.currentUser;
      if (user && newEmail) {
        // Reauthenticate the user
        const credential = EmailAuthProvider.credential(user.email!, password);
        await reauthenticateWithCredential(user, credential);

        // Update the email in Firebase Auth
        await updateEmail(user, newEmail);

        // Update the email in Firestore
        await setDoc(
          doc(firestore, 'users', user.uid),
          { email: newEmail, emailVerified: false },
          { merge: true }
        );

        // Send a verification email to the new address
        await sendEmailVerification(user);
        setEmailVerified(false);

        Alert.alert(
          'Email Update',
          'A confirmation email has been sent to your new address. Please verify it to complete the change.'
        );

        // Reset the form after update
        setEmail(newEmail);
        setNewEmail('');
        setPassword('');
        setIsEditing(false);
      } else {
        Alert.alert('Error', 'Please enter a new email and your current password.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      console.log('Error updating email:', errorMessage);
      Alert.alert('Error', `Failed to update email. ${errorMessage}`);
    }
  };

  return (
    <Layout style={styles.container}>
      {/* Show email verification only after email change */}
      {!emailVerified && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Your new email is not verified. Please check your inbox to complete the verification.
          </Text>
        </View>
      )}

      {/* Name Update Section */}
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

      {/* Email Update Section */}
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