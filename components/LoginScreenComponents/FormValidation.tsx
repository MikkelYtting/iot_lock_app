import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from '@ui-kitten/components';

export default function FormValidation({
  password,
  confirmPassword,
  isSigningUp,
  isFormSubmitted,
}: {
  password: string;
  confirmPassword: string;
  isSigningUp: boolean;
  isFormSubmitted: boolean;
}) {
  // Helper function to check password strength
  const validatePassword = (password: string) => {
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    return { hasMinLength, hasUppercase, hasNumber };
  };

  // Check if passwords match
  const passwordsMatch = password === confirmPassword;
  const passwordValidation = validatePassword(password);

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
