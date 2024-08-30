import React, { useState } from 'react';
import { StyleSheet /* , Image */ } from 'react-native';
import { Layout, Text, Input, Button } from '@ui-kitten/components';
import { useThemeToggle } from '../_layout';

export default function LoginScreen() {
  const { isDarkMode, toggleTheme } = useThemeToggle();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Implement login logic here or prepare for Auth0 integration.
    console.log('Logging in with:', username, password);
  };

  return (
    <Layout style={styles.container}>
      {/* <Image
        source={require('@/assets/images/your-logo.png')} // Replace with your logo
        style={styles.logo}
      /> */}
      <Text category="h1" style={styles.title}>
        Welcome
      </Text>
      <Text category="s1" appearance="hint" style={styles.subtitle}>
        Please sign in to continue
      </Text>
      <Input
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        style={styles.input}
      />
      <Input
        placeholder="Password"
        value={password}
        secureTextEntry
        onChangeText={setPassword}
        style={styles.input}
      />
      <Button style={styles.button} onPress={handleLogin}>
        Sign In
      </Button>
      <Button style={styles.themeToggle} appearance="ghost" onPress={toggleTheme}>
        {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
      </Button>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  // logo: {
  //   width: 100,
  //   height: 100,
  //   marginBottom: 32,
  // },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 32,
  },
  input: {
    marginBottom: 16,
    width: '100%',
  },
  button: {
    marginTop: 16,
    width: '100%',
  },
  themeToggle: {
    marginTop: 24,
  },
});
