import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    // TODO: Implement actual authentication logic
    console.log('Login attempt with:', email, password);
    // Navigate to tabs after successful login
    router.replace('/(tabs)/explore');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} testID="loginScreen">
      <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />        
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="emailInput"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          testID="passwordInput"
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin} testID="loginButton">
          <Text style={styles.buttonText}>Log in</Text>
        </TouchableOpacity>
        
        <TouchableOpacity>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#6bb2be',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  forgotPassword: {
    color: '#6bb2be',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: 'bold',
  },
  logo: {
    width: '100%', // Adjust size as needed
    height: '50%', // Adjust size as needed
    marginBottom: 5,
    alignSelf: 'center',
  },
});

export default LoginScreen;