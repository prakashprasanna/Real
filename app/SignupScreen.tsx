import React, { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert, ScrollView, Platform, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { app } from '../firebaseConfig';
import RNPickerSelect from 'react-native-picker-select';
import { countryCodes } from './utils/countryCodes';


const SignupScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);
  const router = useRouter();
  const auth = getAuth();
  const db = getFirestore(app);


  const handleSignup = async () => {
    if (email === '' || password === '' || confirmPassword === '' || firstName === '' || lastName === '') {
      Alert.alert('Signup Failed', 'Please fill in all required fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Signup Failed', 'Passwords do not match');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User signed up:', user.uid);

      // Add user details to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        email: user.email,
        firstName: firstName,
        lastName: lastName,
        mobileNumber: mobileNumber ? `${countryCode}${mobileNumber}` : null,
        createdAt: new Date(),
        lastLogin: new Date(),
      });

      console.log('User details added to Firestore');

      // Navigate to tabs after successful signup
      router.replace('/(tabs)/explore');
    } catch (error: any) {
      console.error('Signup error:', error.code, error.message);
      Alert.alert('Signup Failed', 'An error occurred during signup. Please try again.');
    }
  };

  const filteredCountryCodes = countryCodes.filter(
    (country) => country.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderCountryItem = ({ item }: { item: { label: string; value: string } }) => (
    <TouchableOpacity
      style={styles.countryItem}
      onPress={() => {
        setCountryCode(item.value);
        setShowCountryPicker(false);
      }}
    >
      <Text>{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content} testID="signupScreen">
          <Image
            source={require('../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <TextInput
            style={styles.input}
            placeholder="First Name"
            value={firstName}
            onChangeText={setFirstName}
            testID="firstNameInput"
          />
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            value={lastName}
            onChangeText={setLastName}
            testID="lastNameInput"
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
          <View style={styles.phoneContainer}>
            <TouchableOpacity
              style={[styles.input, styles.countryCodePicker]}
              onPress={() => setShowCountryPicker(true)}
            >
              <Text>{countryCode || '🌎 Code'}</Text>
            </TouchableOpacity>
            <TextInput
              style={[styles.input, styles.phoneInput]}
              placeholder="Mobile Number (Optional)"
              value={mobileNumber}
              onChangeText={setMobileNumber}
              keyboardType="phone-pad"
              testID="mobileNumberInput"
            />
          </View>
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
      </ScrollView>
      <Modal visible={showCountryPicker} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.searchContainer}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search country"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setShowCountryPicker(false)}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={filteredCountryCodes}
            renderItem={renderCountryItem}
            keyExtractor={(item) => item.value}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logo: {
    width: '70%',
    height: 100,
    alignSelf: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    fontSize: 16,
  },
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  countryCodePicker: {
    width: '30%',
    marginRight: 10,
  },
  phoneInput: {
    flex: 1,
  },
  button: {
    backgroundColor: '#6bb2be',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#333',
    fontSize: 16,
  },
  loginButton: {
    color: '#6bb2be',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  closeButton: {
    color: '#6bb2be',
    fontSize: 16,
    fontWeight: 'bold',
  },
  countryItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    color: 'black',
    paddingRight: 30,
    backgroundColor: '#fff',
  },
  
});

export default SignupScreen;