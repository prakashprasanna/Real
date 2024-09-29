import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { ShoppingItem } from '@/api/shoppingApi';
import { AddToCartButton } from './AddToCartButton';

interface ShoppingItemCardProps {
  item: ShoppingItem;
}

export const ShoppingItemCard: React.FC<ShoppingItemCardProps> = ({ item }) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      <AddToCartButton item={item} onPress={() => {}} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    margin: 10,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
  },
  price: {
    fontSize: 16,
    color: '#888',
    marginVertical: 5,
  },
});