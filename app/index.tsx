import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { enableScreens } from 'react-native-screens';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { setUserId } from '../Redux/authSlice'; 
import { useDispatch } from 'react-redux';
import { app, auth } from '../firebaseConfig';  // Import both app and auth

enableScreens();

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();
  const dispatch = useDispatch();

  const handleLogin = async () => {
    if(email === '' || password === '') {
      Alert.alert('Login Failed', 'Please enter your email and password');
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Signed in 
      const user = userCredential.user;
      console.log('User logged in:', user.uid);
      dispatch(setUserId(user.uid));

      // Navigate to tabs after successful login
      router.replace('/(tabs)/explore');
    } catch (error:any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Login error:', errorCode, errorMessage);
      Alert.alert('Login Failed', errorMessage);
    }
  };

  const handleSignUp = () => {
    // Navigate to the signup screen
    router.push('/SignupScreen');
  };

  const handleForgotPassword = () => {
    router.push('/ForgotPasswordScreen');
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
        
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgotPassword}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={styles.signupText}>Don't have an account?</Text>
          <TouchableOpacity onPress={handleSignUp}>
            <Text style={styles.signupButton}>Sign up</Text>
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
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  signupText: {
    color: '#333',
  },
  signupButton: {
    color: '#6bb2be',
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default LoginScreen;