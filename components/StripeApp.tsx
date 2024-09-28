import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert } from 'react-native';
import { CardField,useConfirmPayment } from '@stripe/stripe-react-native';
import { checkHealth, API_URL } from '../api/CheckHealth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const StripeApp = (props:any) => {
  const {firstName, lastName, email, mobile, destinationData} = props.details;
  const [cardDetails, setCardDetails] = useState(null);
  const { confirmPayment, loading } = useConfirmPayment();

  useEffect(() => {
    async function checkServerHealth() {
      const isHealthy = await checkHealth();
      if (!isHealthy) {
        console.error('Server is not healthy');
        // Handle unhealthy server (e.g., show error message)
      }else{
        console.log('Server is healthy');
      }
    }
    checkServerHealth();
  }, []);

  const fetchPaymentIntentClientSecret = async () => {
    try {
      console.log('Fetching from:', `${API_URL}/create-payment-intent`);
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount: 1000 }),
      });
  
      console.log('Response status:', response.status);

      const data = await response.json();
      console.log('Response data:', data);

      try {
        const existingPurchases = await AsyncStorage.getItem('purchases');
        const purchases = existingPurchases ? JSON.parse(existingPurchases) : [];

        const newPurchase = {
          id: destinationData.id,
          amount: 10,
          date: new Date().toISOString(),
          description: destinationData.name,
          imageUrl: destinationData.image,
        };
        purchases.push(newPurchase);

        await AsyncStorage.setItem('purchases', JSON.stringify(purchases));
        console.log('Purchase saved successfully');
      } catch (error) {
        console.error('Error saving purchase:', error);
      }
  
      return { clientSecret: data.clientSecret };  
  
    } catch (error) {
      console.error('Detailed fetch error:', error);
      throw error;
    }
  };

  const handlePayment = async () => {
    if(!cardDetails || !email) {
        Alert.alert('Error', 'Please enter your card details & email');
        return;
    }   
    const billingDetails = {
        email: email,
    }
    try{
        const { clientSecret } = await fetchPaymentIntentClientSecret();

        const { paymentIntent, error } = await confirmPayment(clientSecret, {
            paymentMethodType: 'Card',
            paymentMethodData: {
                billingDetails: billingDetails,
            },
        });
        if(error) {
            //console.log(error);
            Alert.alert('Error', error.message);
            return;
        }
        if(paymentIntent) {
            Alert.alert('Success', 'Payment successful');
        }
    } catch (error) {
        console.log(error);

        Alert.alert('Error', error instanceof Error ? error.message : 'An unknown error occurred');
    }

  }
  return (
    <View style={styles.container}>
        <CardField  
            style={styles.cardField}
            postalCodeEnabled={true}
            placeholders={{
                number: '4242 4242 4242 4242',
            }}
            onCardChange={(cardDetails:any) => setCardDetails(cardDetails)}
        />  
        <TouchableOpacity 
        style={[styles.payButton]} 
        onPress={handlePayment}
        disabled={loading}
        >
        <Text style={styles.payButtonText}>
          {loading ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default StripeApp;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    input: {    
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        width: '100%',
    },
    cardField: {
        width: '100%',
        height: 50,
        marginVertical: 30,
        backgroundColor: 'red',
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
