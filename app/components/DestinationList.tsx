import React, { useState } from 'react';
import { FlatList, View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Destination } from '../../api/destinationsApi';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 
import FilterButtons from './FilterButtons';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.5;

type DestinationListProps = {
  destinations: Destination[];
  onLoadMore: () => void;
  loading: boolean;
  isFavoritesList?: boolean;
  onFavoriteRemove?: (id: string) => void;
};


export default function DestinationList({ 
  destinations, 
  onLoadMore, 
  loading, 
  isFavoritesList = false,
  onFavoriteRemove
}: DestinationListProps) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Beach', 'Mountain', 'City', 'Countryside'];

  const handleFilterPress = (filter: string) => {
    setActiveFilter(filter);
    // Here you would typically filter the destinations based on the selected filter
    // For now, we'll just log the selected filter
    console.log('Selected filter:', filter);
  };

  const handleFavoriteRemove = async (id: string) => {
    if (onFavoriteRemove) {
      onFavoriteRemove(id);
    } else {
      try {
        const favoritesJson = await AsyncStorage.getItem('favorites');
        let favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
        favorites = favorites.filter((fav: Destination) => fav.id !== id);
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
      } catch (error) {
        console.error('Error removing favorite:', error);
      }
    }
  };

  const renderDestinationItem = ({ item }: { item: Destination }) => (
    <View style={styles.destinationItem}>
      <TouchableOpacity
        style={styles.destinationContent}
        onPress={() => router.push({
          pathname: '/(tabs)/explore/DestinationDetailScreen',
          params: { destination: JSON.stringify(item) }
        })}>
        <Image source={{ uri: item.image }} style={styles.destinationImage} />
        {/* <View style={styles.destinationInfo}>
          <Text style={styles.destinationName}>{item.name}</Text>
          <Text style={styles.destinationDescription} numberOfLines={2}>{item.description}</Text>
        </View> */}
      </TouchableOpacity>
      {isFavoritesList && (
        <TouchableOpacity 
          style={styles.deleteButton} 
          onPress={() => handleFavoriteRemove(item.id)}
        >
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
        <FilterButtons
          filters={filters}
          activeFilter={activeFilter}
          onFilterPress={handleFilterPress}
        />
       <View style={styles.arrowContainer}>
        <Ionicons name="arrow-forward" size={24} color="black" />
        {/* <Text style={styles.arrowText}>Scroll for more</Text> */}
      </View>
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={true}
        data={destinations}
        renderItem={renderDestinationItem}
        keyExtractor={(item) => item.id}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => loading && <ActivityIndicator size="large" color="#0000ff" />}
        contentContainerStyle={styles.listContent}
        snapToInterval={ITEM_WIDTH + 20}
        decelerationRate="fast"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginBottom: 10, 
  },
  carouselContainer: {
    height: 170, 
    marginBottom: 10,
  },
  arrowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 10,
    marginBottom: 5,
  },
  arrowText: {
    marginRight: 5,
    fontSize: 14,
    color: 'black',
  },
  listContent: {
    paddingHorizontal: 10,
    paddingBottom: 20, 
  },
  destinationItem: {
    width: ITEM_WIDTH,
    marginRight: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  destinationContent: {
    flex: 1,
  },
  destinationImage: {
    height: '100%',
    resizeMode: 'cover',
  },
  destinationInfo: {
    padding: 10,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  destinationDescription: {
    fontSize: 14,
    color: 'gray',
  },
  deleteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});