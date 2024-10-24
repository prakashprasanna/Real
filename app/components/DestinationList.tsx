import React, { useState } from 'react';
import { FlatList, View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions } from 'react-native';
import { Destination } from '../../api/destinationsApi';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 
import FilterButtons from './FilterButtons';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.2;

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
  const filters = ['All', 'Fasion', 'Shopping', 'Food', 'Games'];

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
      <View style={styles.nameContainer}>
        <Text style={styles.nameBelowImage}>{item.name}</Text>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <Text style={styles.emptyListText}>
        {isFavoritesList 
          ? "You haven't added any followers yet." 
          : "No followers available at the moment."}
      </Text>
      <Text style={styles.emptyListSubText}>
        {isFavoritesList 
          ? "Explore users and follow them!" 
          : "Please check back later or try refreshing."}
      </Text>
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
      </View>
      {destinations.length === 0 ? (
        renderEmptyList()
      ) : (
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={true}
        data={destinations}
        renderItem={renderDestinationItem}
        keyExtractor={(item) => item.id}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() => loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20,alignContent:'center' }} />}
        contentContainerStyle={styles.listContent}
        snapToInterval={ITEM_WIDTH + 20}
        decelerationRate="fast"
      />
    )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '25%',
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
    paddingBottom: 30, 
    marginTop: 10,
  },
  destinationItem: {
    width: ITEM_WIDTH,
    marginRight: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'visible', // Changed from 'hidden' to 'visible'
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    //paddingBottom: 20, // Add padding at the bottom for the name
  },
  destinationContent: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#000',
  },
  destinationImage: {
    height: '100%',
    resizeMode: 'cover',
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
  destinationInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
  },
  destinationName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  nameContainer: {
    position: 'absolute',
    bottom: -25, // Adjust this value to position the name below the image
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  nameBelowImage: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyListText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyListSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
  },
});