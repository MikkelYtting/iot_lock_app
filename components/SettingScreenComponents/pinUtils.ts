// // pinUtils.ts
// import { Alert } from 'react-native';
// import { auth, firestore } from './path/to/your/firebase';
// import { doc, setDoc } from 'firebase/firestore';
// import { router } from 'expo-router';

// export const sendVerificationPin = async (email: string, setPin: (pin: string) => void, setInitialKeypadEntry: (flag: boolean) => void) => {
//   const user = auth.currentUser;
//   if (!user) {
//     Alert.alert('Error', 'User is not authenticated.');
//     return;
//   }

//   if (!email) {
//     Alert.alert('Error', 'Please enter a valid email before requesting a PIN.');
//     return;
//   }

//   const generatedPin = Math.floor(10000 + Math.random() * 90000).toString(); // Ensure it's a 5-digit PIN
//   setPin(generatedPin);

//   try {
//     const expirationTime = new Date();
//     expirationTime.setMinutes(expirationTime.getMinutes() + 1);

//     const pinDocRef = doc(firestore, 'pins', user.uid);
//     await setDoc(pinDocRef, {
//       pin: generatedPin,
//       createdAt: new Date(),
//       ttl: expirationTime,
//       userId: user.uid,
//     });

//     console.log(`PIN (${generatedPin}) stored in Firestore for user: ${user.uid}`);

//     const emailResponse = await fetch(
//       
//     );

//     if (!emailResponse.ok) {
//       const errorText = await emailResponse.text();
//       throw new Error(`Failed to send email: ${errorText}`);
//     }

//     // Reset initial keypad flag since a new PIN is generated
//     setInitialKeypadEntry(true);

//     // Go directly to the keypad without showing the message box if a new PIN is generated
//     router.push({ pathname: '/(tabs)/settings/PinVerificationScreen', params: { userEmail: email } });

//   } catch (error) {
//     if (error instanceof Error) {
//       console.error('Error sending PIN:', error.message);
//       Alert.alert('Error', 'Failed to send PIN. Please try again.');
//     } else {
//       console.error('Unexpected error', error);
//     }
//   }
// };
