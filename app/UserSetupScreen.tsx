// import React, { useState } from 'react';
// import { View, StyleSheet, Dimensions } from 'react-native';
// import { Input, Button, Text } from '@ui-kitten/components';
// import { useRouter } from 'expo-router';
// import { auth, firestore } from '../firebase';
// import { doc, setDoc } from 'firebase/firestore';

// const { width } = Dimensions.get('window');

// export default function UserSetupScreen() {
//   const [name, setName] = useState('');
//   const [address, setAddress] = useState('');
//   const [error, setError] = useState('');
//   const router = useRouter();

//   const handleSubmit = async () => {
//     if (!name || !address) {
//       setError('All fields are required.');
//       return;
//     }

//     try {
//       const user = auth.currentUser;

//       if (user) {
//         const userDoc = doc(firestore, 'users', user.uid);

//         // Save additional user info to Firestore
//         await setDoc(userDoc, {
//           name,
//           address,
//           email: user.email, // Also save the user's email
//         });

//         // Redirect to home screen after saving the user info
//         router.replace('/(tabs)/home/HomeScreen');
//       }
//     } catch (error) {
//       setError('An error occurred while saving your information.');
//     }
//   };

//   return (
//     <View style={styles.container}>
//       <Text category="h1" style={styles.title}>
//         Complete Your Profile
//       </Text>
//       {error && <Text status="danger" style={styles.errorText}>{error}</Text>}
//       <Input
//         placeholder="Name"
//         value={name}
//         onChangeText={setName}
//         style={styles.input}
//       />
//       <Input
//         placeholder="Address"
//         value={address}
//         onChangeText={setAddress}
//         style={styles.input}
//       />
//       <Button onPress={handleSubmit} style={styles.submitButton}>
//         Submit
//       </Button>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     paddingHorizontal: width * 0.05,
//   },
//   title: {
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   input: {
//     marginBottom: 20,
//   },
//   submitButton: {
//     marginTop: 20,
//   },
//   errorText: {
//     color: 'red',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
// });
