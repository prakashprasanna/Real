import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Destination } from '../../../api/destinationsApi';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import StackHeader from '@/app/components/StackHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '@/hooks/useCart';
import { AddToCartButton } from '@/app/components/AddToCartButton';
import { MaterialIcons } from '@expo/vector-icons';


// type DestinationDetailScreenProps = {
//   route: { params: { destination: Destination } };
// };

export default function DestinationDetailScreen({ route }: any) {
    // console.log(route)
//   const { destination } = route?.params;
const router = useRouter();
// console.log(useLocalSearchParams())
const { destination } = useLocalSearchParams();

// Parse the destination if it's a string
const destinationData = typeof destination === 'string' ? JSON.parse(destination) : destination;

const [isFavorite, setIsFavorite] = useState(false);
useEffect(() => {
    checkFavoriteStatus();
  }, []);

  const checkFavoriteStatus = async () => {
    const favorites = await AsyncStorage.getItem('favorites');
    console.log(favorites)
    if (favorites) {
      const favoritesArray = JSON.parse(favorites);
      setIsFavorite(favoritesArray.some((fav: Destination) => fav.id === destinationData.id));
    }
  };

  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      let favoritesArray = favorites ? JSON.parse(favorites) : [];
      
      if (isFavorite) {
        favoritesArray = favoritesArray.filter((fav: Destination) => fav.id !== destinationData.id);
      } else {
        favoritesArray.push(destinationData);
      }
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const handleBuy = () => {
    router.push({
      pathname: '/PaymentScreen',
      params: { destination: JSON.stringify(destinationData) }
    });
  };

  return (
    <>
    <StackHeader detail={'Detail'} />
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <ScrollView>
        <Image source={{ uri: destinationData.image }} style={styles.image} />
        <View style={styles.content}>
            <View style={styles.header}>
                <Text style={styles.name}>{destinationData.name}</Text>
                <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
                <Text>{isFavorite ? '❌ Remove from Favorites' : '⭐ Add to Favorites'}</Text>
                </TouchableOpacity>
            </View>
            <Text style={styles.description}>{destinationData.description}</Text>
          {/* Add more details as needed */}
          <View style={styles.cartView}>
            <AddToCartButton item={destinationData} />
            <TouchableOpacity onPress={handleBuy} style={styles.buyButton}>
            <MaterialIcons name="payment" size={24} color="white" />
            <Text style={styles.buyButtonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  backButton: {
    padding: 10,
    marginTop: 10, // Adjust this value based on your status bar height
  },
  backButtonText: {
    fontSize: 18,
    color: '#6bb2be', // Or any color that fits your design
    fontWeight: 'bold',
  },
  favoriteButton: {
    marginTop: 1,
    padding: 10,
    backgroundColor: '#b2b2b2',
    borderRadius: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  buyButton: {
    marginTop: 20,
    backgroundColor: '#6bb2be',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    width: '45%',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  buyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  cartView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});