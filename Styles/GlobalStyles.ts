// Adjusted the styles to ensure consistency across the app
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const GlobalStyles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05,
  },
  transparentBox: {
    width: '90%',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  title: {
    textAlign: 'center',
    fontSize: width * 0.04, // Dynamic font size
    marginBottom: 20,
    color: '#fff',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
    color: 'grey',
    fontSize: width * 0.02, // Dynamic font size
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  rememberMeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  forgotPassword: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontSize: width * 0.01, // Same size as Remember Me
  },
  loginButton: {
    backgroundColor: '#FF0000',
    borderColor: '#FF0000',
    marginBottom: 20,
  },
  googleButton: {
    backgroundColor: '#4285F4',
    marginBottom: 20,
  },
  separatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  orText: {
    marginHorizontal: 10,
    color: 'grey',
    fontSize: width * 0.035, // Match the size with the validation text
  },
  switchButton: {
    marginTop: 20,
  },
  themeToggle: {
    marginTop: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: width * 0.03, // Match the validation text size
  },
});

export default GlobalStyles;
