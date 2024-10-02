import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, Dimensions } from 'react-native';
import { Button, Input, Text, Layout } from '@ui-kitten/components';
import { useRouter } from 'expo-router';
import { updateProfile, reauthenticateWithCredential, EmailAuthProvider, updateEmail, sendEmailVerification } from 'firebase/auth';
import { auth, firestore } from '../../../firebase'; // Adjusted Path
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { validateEmail, validatePassword } from '../../../components/LoginScreenComponents/FormValidation'; // Correct Import Path

const { width } = Dimensions.get('window');

export default function AccountScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState(''); // Required for reauthentication
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState({ name: '', newEmail: '', password: '' });
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
        await setDoc(doc(firestore, 'users', user.uid), {
          name,
          email: user.email,
        });

        Alert.alert('Success', 'Name updated successfully.');
      }
    } catch (error) {
      console.log('Error updating name:', error);
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

        // Send a verification email to the new address
        await sendEmailVerification(user);
        Alert.alert(
          'Email Verification',
          `A verification email has been sent to ${email}. Please verify the email before updating your account.`
        );

        return;
      } else {
        Alert.alert('Error', 'Please enter a new email and your current password.');
      }
    } catch (error) {
      console.log('Error updating email:', error);
      Alert.alert('Error', 'Failed to update email. Please ensure your password is correct.');
    }
  };

  return (
    <Layout style={styles.container}>
     
      
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
      <Input
        placeholder="Current Email"
        value={email}
        disabled
        style={styles.input}
      />
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
  title: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 24,
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
  logoutButton: {
    marginVertical: 20,
  },
});
