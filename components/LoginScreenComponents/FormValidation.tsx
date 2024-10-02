import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from '@ui-kitten/components';

// Move validatePassword outside of the component and export it
export function validatePassword(password: string) {
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  return { hasMinLength, hasUppercase, hasNumber };
}

export function validateEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export default function FormValidation({
  password,
  confirmPassword,
  email,
  isSigningUp,
  isFormSubmitted,
}: {
  password: string;
  confirmPassword: string;
  email: string;
  isSigningUp: boolean;
  isFormSubmitted: boolean;
}) {
  // Use the exported validatePassword function
  const passwordValidation = validatePassword(password);

  // Check if passwords match
  const passwordsMatch = password === confirmPassword;

  const renderValidationIcon = (isValid: boolean) => (
    <Icon
      name={isValid ? 'checkmark-circle-2-outline' : 'close-circle-outline'}
      fill={isValid ? 'green' : 'red'}
      style={{ width: 20, height: 20, marginRight: 5 }}
    />
  );

  return (
    <View>
      {isSigningUp && (
        <View style={styles.passwordValidation}>
          <View style={styles.validationRow}>
            {renderValidationIcon(passwordValidation.hasMinLength)}
            <Text status={passwordValidation.hasMinLength ? 'success' : 'danger'}>
              At least 8 characters
            </Text>
          </View>
          <View style={styles.validationRow}>
            {renderValidationIcon(passwordValidation.hasUppercase)}
            <Text status={passwordValidation.hasUppercase ? 'success' : 'danger'}>
              At least 1 uppercase letter
            </Text>
          </View>
          <View style={styles.validationRow}>
            {renderValidationIcon(passwordValidation.hasNumber)}
            <Text status={passwordValidation.hasNumber ? 'success' : 'danger'}>
              At least 1 number
            </Text>
          </View>
          <View style={styles.validationRow}>
            {renderValidationIcon(passwordsMatch)}
            <Text status={passwordsMatch ? 'success' : 'danger'}>
              Passwords must match
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  passwordValidation: {
    marginBottom: 20,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
});
