import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useStripe } from '@stripe/stripe-react-native';
import StripeApp from '../../components/StripeApp';
import { StripeProvider } from '@stripe/stripe-react-native';

export default function PaymentScreen() {
  const { destination } = useLocalSearchParams();
  const destinationData = JSON.parse(destination as string);
  const [loading, setLoading] = useState(false);
  const [paymentReady, setPaymentReady] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');

  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const fetchPaymentSheetParams = async () => {
    const response = await fetch('http://localhost:4000/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 10, // amount in cents
        currency: 'usd',
      }),
    });
    const { paymentIntent, ephemeralKey, customer } = await response.json();

    return {
      paymentIntent,
      ephemeralKey,
      customer,
    };
  };

  const initializePaymentSheet = async () => {
    try {
      setLoading(true);
      const {
        paymentIntent,
        ephemeralKey,
        customer,
      } = await fetchPaymentSheetParams();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "Real",
        customerId: customer,
        customerEphemeralKeySecret: ephemeralKey,
        paymentIntentClientSecret: paymentIntent,
        allowsDelayedPaymentMethods: true,
      });

      if (error) {
        console.error('Error initializing payment sheet:', error);
        Alert.alert(`Error code: ${error.code}`, error.message);
      } else {
        setPaymentReady(true);
      }
    } catch (e) {
      console.error('Error in initializePaymentSheet:', e);
      Alert.alert('Error', 'Unable to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!firstName || !lastName || !email || !mobile) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    await initializePaymentSheet();

    if (!paymentReady) {
      Alert.alert('Error', 'Payment is not ready yet. Please wait.');
      return;
    }

    setLoading(true);
    const { error } = await presentPaymentSheet();

    if (error) {
      console.error('Error presenting payment sheet:', error);
      Alert.alert(`Error code: ${error.code}`, error.message);
    } else {
      Alert.alert('Success', 'Your payment is confirmed!');
      // Here you could send the user's information to your server
      console.log('User info:', { firstName, lastName, email, mobile });
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: destinationData.image }} style={styles.image} />
      <Text style={styles.destinationName}>{destinationData.name}</Text>
      <Text style={styles.price}>Price: $10.00</Text>
      
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mobile"
        value={mobile}
        onChangeText={setMobile}
        keyboardType="phone-pad"
      />
      <StripeProvider publishableKey={'pk_test_51Q0KewLN1sWuQDkGPMtzTZVYJ0HB2AJppDVIHGwZlTw6BJ5YXzhh5X8Rf2GpqsFzLMDONVoJYsh0pklNEoQK8vDM00YY4xJfWP'}>
        <StripeApp details={{firstName, lastName, email, mobile, destinationData}}/>
      </StripeProvider>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  destinationName: {
    fontSize: 18,
    marginBottom: 10,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  payButton: {
    backgroundColor: '#6bb2be',
    padding: 15,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  payButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});