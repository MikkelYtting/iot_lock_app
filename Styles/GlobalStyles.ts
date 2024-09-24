import { StyleSheet, Dimensions } from 'react-native';

// Retrieve the width of the screen to use for responsive design
const { width } = Dimensions.get('window');

const GlobalStyles = StyleSheet.create({
  background: {
    // Ensures the screen takes up the full available space and centers content
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    // The main container of the screen is centered both horizontally and vertically, with padding for the sides
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: width * 0.05, // Adds 5% of the screen width as padding on the sides
  },
  transparentBox: {
    // A semi-transparent box in the center of the screen, styled for content such as forms
    width: '90%', // The box width is 90% of the screen
    padding: 20, // Padding inside the box for spacing
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Semi-transparent background
    borderRadius: 10, // Rounded corners
    borderWidth: 1, // Thin border around the box
    borderColor: 'rgba(255, 255, 255, 0.3)', // Light border color with some transparency
  },
  title: {
    // Style for the main title, centered and dynamically sized
    textAlign: 'center', // Centers the text horizontally
    fontSize: width * 0.05, // Font size is 5% of the screen width, making it responsive
    marginBottom: 20, // Adds space below the title
    color: '#fff', // Title color is white
  },
  subtitle: {
    // Style for subtitles under the title, smaller and grey in color
    textAlign: 'center',
    marginBottom: 20, // Adds space below the subtitle
    color: 'grey', // Subtitle color is grey
    fontSize: width * 0.03, // Font size is 3% of the screen width, keeping it responsive
  },
  input: {
    // Style for text input fields, spaced and with a background color for visibility
    marginBottom: 20, // Space below each input field
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Slightly transparent background color
  },
  rememberMeContainer: {
    // Flexbox row container for the "Remember Me" checkbox and "Forgot Password" link
    flexDirection: 'row', // Lays out items horizontally
    justifyContent: 'space-between', // Ensures items (checkbox and link) are spaced apart
    alignItems: 'center', // Aligns the checkbox and text vertically centered
    marginBottom: 20, // Adds space below the container
    width: '100%', // Ensures the container takes up the full width available
  },
  rememberMeText: {
    // Style for the "Remember Me" text
    fontSize: width * 0.02, // Font size is 2% of the screen width
    color: '#fff', // White text color
    marginLeft: 5, // Adds a small gap between the checkbox and text
  },
  forgotPassword: {
    // Style for the "Forgot Password" link, similar to the "Remember Me" text
    color: '#fff', // White text color
    textDecorationLine: 'underline', // Underlines the text to indicate a link
    fontSize: width * 0.02, // Same font size as the "Remember Me" text for consistency
    marginRight: 5, // Adds a small margin to the right
  },
  loginButton: {
    // Style for the login button, red with no border and spaced below
    backgroundColor: '#FF0000', // Bright red background
    borderColor: '#FF0000', // Red border (same color as background, making it invisible)
    marginBottom: 20, // Adds space below the button
  },
  googleButton: {
    // Style for the Google login button, blue with space below
    backgroundColor: '#4285F4', // Google blue background color
    marginBottom: 20, // Adds space below the button
  },
  separatorContainer: {
    // Flexbox container for the "Or" separator line, laid out horizontally
    flexDirection: 'row', // Lays out the line and "Or" horizontally
    alignItems: 'center', // Vertically centers the line and text
    marginVertical: 20, // Adds space above and below the separator
  },
  line: {
    // Style for the horizontal line in the "Or" separator
    flex: 1, // Fills the remaining space on both sides of the "Or" text
    height: 1, // Line thickness
    backgroundColor: '#ccc', // Light grey color for the line
  },
  orText: {
    // Style for the "Or" text in the separator
    marginHorizontal: 10, // Adds space on both sides of the text
    color: 'grey', // Grey text color
    fontSize: width * 0.035, // Font size is 3.5% of the screen width
  },
  switchButton: {
    // Style for the button that switches between login and signup modes
    marginTop: 20, // Adds space above the button
  },
  themeToggle: {
    // Style for the theme toggle button (switch between light and dark modes)
    marginTop: 20, // Adds space above the button
  },
  errorText: {
    // Style for error messages, red and centered
    color: 'red', // Error text color is red
    textAlign: 'center', // Centers the error text horizontally
    marginBottom: 10, // Adds space below the error message
    fontSize: width * 0.02, // Font size is 3.5% of the screen width, matching validation text size
  },
  successText: {
    // Style for success messages, green and centered
    color: 'green', // Success text color is green
    textAlign: 'center', // Centers the success text horizontally
    marginBottom: 10, // Adds space below the success message
    fontSize: width * 0.035, // Font size is 3.5% of the screen width, matching validation text size
  },
  checkBox: {
    // Style for the checkbox in the "Remember Me" section
    marginRight: 5, // Adds a small gap between the checkbox and the text
  },
});

export default GlobalStyles;
