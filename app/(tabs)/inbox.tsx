import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface Purchase {
  id: string;
  amount: number;
  date: string;
  description: string;
  imageUrl: string;
}

export default function Inbox() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useFocusEffect(
    useCallback(() => {
    const loadPurchases = async () => {
      try {
        const storedPurchases = await AsyncStorage.getItem('purchases');
        if (storedPurchases) {
          setPurchases(JSON.parse(storedPurchases));
        }
      } catch (error) {
        console.error('Error loading purchases:', error);
      }
    };
    loadPurchases();
  }, [])
);

  const renderItem = ({ item }: { item: Purchase }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.itemDetails}>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.amount}>${(item.amount / 100).toFixed(2)}</Text>
        <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={purchases}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>No purchases yet</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  item: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  image: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  itemDetails: {
    flex: 1,
  },
  description: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  amount: {
    fontSize: 14,
    color: 'green',
  },
  date: {
    fontSize: 12,
    color: 'gray',
  },
});