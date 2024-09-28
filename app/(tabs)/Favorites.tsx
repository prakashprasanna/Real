import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

interface Destination {
  id: string;
  name: string;
  image: string;
  description: string;
}

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState<Destination[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadFavorites = async () => {
        try {
          const storedFavorites = await AsyncStorage.getItem('favorites');
          if (storedFavorites) {
            setFavorites(JSON.parse(storedFavorites));
          }
        } catch (error) {
          console.error('Error loading favorites:', error);
        }
      };
      loadFavorites();
    }, [])
  );

  const deleteFavorite = async (id: string) => {
    try {
      const updatedFavorites = favorites.filter(favorite => favorite.id !== id);
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
    } catch (error) {
      console.error('Error deleting favorite:', error);
    }
  };

  const renderItem = ({ item }: { item: Destination }) => (
    <View style={styles.item}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      </View>
      <TouchableOpacity onPress={() => deleteFavorite(item.id)} style={styles.deleteButton}>
        <Text style={styles.deleteButtonText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={favorites}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No favorites yet</Text>}
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
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
  },
  image: {
    width: 100,
    height: 100,
  },
  textContainer: {
    flex: 1,
    padding: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  description: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    color: '#666',
  },
  deleteButton: {
    padding: 5,
    backgroundColor: 'red',
    borderRadius: 5,
    marginRight: 10,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});