import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text, Input, Button } from '@ui-kitten/components';
import { sendPasswordResetEmail } from 'firebase/auth'; // Firebase reset password function
import { auth } from '../firebase'; // Import Firebase auth
import GlobalStyles from '../Styles/GlobalStyles'; // Global styles
import { useRouter } from 'expo-router'; // To navigate back to login
import { LinearGradient } from 'expo-linear-gradient';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleForgotPassword = async () => {
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Please enter your email.');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setSuccessMessage('Password reset email sent!');
    } catch (error) {
      setError('Failed to send password reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0D0000', 'black', '#0D0000']} style={GlobalStyles.background}>
      <View style={GlobalStyles.container}>
        <View style={GlobalStyles.transparentBox}>
          <Text category="h1" style={GlobalStyles.title}>Forgot Password</Text>
          <Text category="s1" appearance="hint" style={GlobalStyles.subtitle}>
            Enter your email address and we'll send you instructions to reset your password.
          </Text>

          <Input
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            style={GlobalStyles.input}
          />

          {error && <Text status="danger" style={GlobalStyles.errorText}>{error}</Text>}
          {successMessage && <Text status="success" style={GlobalStyles.successText}>{successMessage}</Text>}

          <Button
            style={GlobalStyles.loginButton}
            onPress={handleForgotPassword}
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Email'}
          </Button>
          <TouchableOpacity onPress={() => router.replace('/login/LoginScreen')}>
         <Text style={GlobalStyles.forgotPassword}>
           Back to Login
              </Text>
        </TouchableOpacity>

        </View>
      </View>
    </LinearGradient>
  );
};

export default ForgotPasswordScreen;
