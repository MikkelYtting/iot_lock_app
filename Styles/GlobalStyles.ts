import { StyleSheet } from 'react-native';

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  button: {
    marginTop: 16,
    width: '100%',
  },
  switchButton: {
    marginTop: 16,
    width: '100%',
  },
  themeToggle: {
    marginTop: 24,
  },
  passwordCriteria: {
    marginBottom: 16,
    width: '100%',
  },
  valid: {
    color: 'green',
  },
  invalid: {
    color: 'red',
  },
});
