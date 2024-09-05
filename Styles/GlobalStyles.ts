import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window'); // Get screen dimensions

export const loginStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 0.05 * width, // 5% padding from screen width
  },
  title: {
    marginBottom: 0.02 * width, // Dynamic margin bottom
    fontSize: 0.06 * width, // Dynamic title font size (6% of screen width)
  },
  subtitle: {
    marginBottom: 0.08 * width,
    fontSize: 0.045 * width, // Dynamic subtitle font size
  },
  errorText: {
    color: 'red',
    marginBottom: 0.04 * width, // Dynamic error text margin
    fontSize: 0.04 * width, // Error text size
  },
  input: {
    marginBottom: 0.04 * width,
    width: '100%',
    fontSize: 0.045 * width, // Input text size
  },
  button: {
    marginTop: 0.04 * width,
    width: '100%',
    paddingVertical: 0.03 * width, // Dynamic button padding
  },
  switchButton: {
    marginTop: 0.04 * width,
    width: '100%',
    fontSize: 0.045 * width, // Switch button font size
  },
  themeToggle: {
    marginTop: 0.06 * width,
    width: '100%',
    fontSize: 0.045 * width, // Theme toggle font size
  },
  passwordCriteria: {
    marginBottom: 0.04 * width,
    width: '100%',
  },
  valid: {
    color: 'green',
  },
  invalid: {
    color: 'red',
  },
});
