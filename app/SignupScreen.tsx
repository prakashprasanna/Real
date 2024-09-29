import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();
  const auth = getAuth();

  const handleSignup = async () => {
    if (email === '' || password === '' || confirmPassword === '') {
      Alert.alert('Signup Failed', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Signup Failed', 'Passwords do not match');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      // Signed up
      const user = userCredential.user;
      console.log('User signed up:', user.uid);
      // Navigate to tabs after successful signup
      router.replace('/(tabs)/explore');
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Signup error:', errorCode, errorMessage);
      Alert.alert('Signup Failed', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content} testID="signupScreen">
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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          testID="confirmPasswordInput"
        />
        <TouchableOpacity style={styles.button} onPress={handleSignup} testID="signupButton">
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.loginButton}>Log in</Text>
          </TouchableOpacity>
        </View>
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
  logo: {
    width: '100%',
    height: '30%',
    marginBottom: 20,
    alignSelf: 'center',
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
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#333',
  },
  loginButton: {
    color: '#6bb2be',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default SignupScreen;