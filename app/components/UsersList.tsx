import React, { useState, useEffect } from 'react';
import { FlatList, View, Text, Image, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, RefreshControl, Platform } from 'react-native';
import { User, fetchUsers } from '../../api/destinationsApi';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons'; 
import FilterButtons from './FilterButtons';
import SearchBar from './SearchBar';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = width * 0.2;

interface UsersListProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onFollowUnfollow: (userId: string, isFollowed: boolean) => Promise<void>;
  loadUsers: (page: number, pageSize: number, onlyFollowing: boolean) => Promise<User[]>;
  isFavoritesList?: boolean;
  onFavoriteRemove?: (id: string) => void;
  onlyFollowing?: boolean;
}

export default function UsersList({ 
  users,
  setUsers,
  onFollowUnfollow,
  loadUsers,
  isFavoritesList = false,
  onFavoriteRemove,
  onlyFollowing = true
}: UsersListProps) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');
  const filters = ['All', 'Fasion', 'Shopping', 'Food', 'Games'];
  const pageSize = 10;

  useEffect(() => {
    if (!Array.isArray(users)) {
      console.error('[UsersList] Users prop is not an array:', users);
      setUsers([]);
    } else {
      loadMoreUsers();
    }
  }, [page, onlyFollowing, users]);

  const loadMoreUsers = async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      console.log(`[UsersList] Fetching users. Page: ${page}, PageSize: ${pageSize}, OnlyFollowing: ${onlyFollowing}`);
      const fetchedUsers = await loadUsers(page, pageSize, onlyFollowing);
      console.log(`[UsersList] Raw fetched users:`, fetchedUsers);
      
      if (!Array.isArray(fetchedUsers)) {
        console.error('[UsersList] Fetched users is not an array:', fetchedUsers);
        setHasMore(false);
        return;
      }
      
      console.log(`[UsersList] Fetched ${fetchedUsers.length} users:`, JSON.stringify(fetchedUsers, null, 2));
      
      if (fetchedUsers.length === 0) {
        setHasMore(false);
      } else {
        setUsers(prevUsers => {
          const newUsers = [...prevUsers, ...fetchedUsers];
          const uniqueUsers = newUsers.filter((user, index, self) =>
            index === self.findIndex((t) => t.id === user.id)
          );
          return uniqueUsers;
        });
      }
    } catch (error) {
      console.error('[UsersList] Error fetching users:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    setUsers([]);
    setPage(1);
    setHasMore(true);
    await loadMoreUsers();
    setRefreshing(false);
  };

  const handleFilterPress = (filter: string) => {
    setActiveFilter(filter);
    console.log('Selected filter:', filter);
    setUsers([]);
    setPage(1);
    setHasMore(true);
  };

  const handleFavoriteRemove = async (id: string) => {
    if (onFavoriteRemove) {
      onFavoriteRemove(id);
    } else {
      try {
        const favoritesJson = await AsyncStorage.getItem('favorites');
        let favorites = favoritesJson ? JSON.parse(favoritesJson) : [];
        favorites = favorites.filter((fav: User) => fav.id !== id);
        await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
        setUsers(users.filter(user => user.id !== id));
      } catch (error) {
        console.error('Error removing favorite:', error);
      }
    }
  };

  const handleFollowUnfollow = async (userId: string, isFollowed: boolean) => {
    try {
      await onFollowUnfollow(userId, isFollowed);
      // Reset the list and reload
      setUsers([]);
      setPage(1);
      setHasMore(true);
      await loadMoreUsers();
    } catch (error) {
      console.error('[UsersList] Error in follow/unfollow:', error);
    }
  };
  
  const renderDestinationItem = ({ item }: { item: User }) => (
    <View style={styles.destinationItem}>
      <TouchableOpacity
        style={styles.destinationContent}
        onPress={() => router.push({
          pathname: '/(tabs)/explore/UserReelsScreen',
          params: { 
            user: JSON.stringify({
              id: item.id,
              firstName: item.firstName,
              lastName: item.lastName,
              profileImageUrl: item.profileImageUrl,
            })
          }
        })}
      >
        <Image
          source={{ uri: item.profileImageUrl }}
          style={styles.destinationImage}
        />
      </TouchableOpacity>
      {/* <TouchableOpacity
        style={[styles.followButton, item.isFollowed ? styles.unfollowButton : null]}
        onPress={() => handleFollowUnfollow(item.id, item.isFollowed || false)}
      >
        <Text style={styles.followButtonText}>
          {item.isFollowed ? 'X' : 'follow'}
        </Text>
      </TouchableOpacity> */}
      {isFavoritesList && (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleFavoriteRemove(item.id)}
        >
          <Text style={styles.deleteButtonText}>X</Text>
        </TouchableOpacity>
      )}
      <View style={styles.nameContainer}>
        <Text style={styles.nameBelowImage}>{item.firstName}</Text>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyListContainer}>
      <Text style={styles.emptyListText}>
        {onlyFollowing 
          ? "You're not following anyone yet." 
          : isFavoritesList 
            ? "You haven't added any followers yet." 
            : "No users available at the moment."}
      </Text>
      <Text style={styles.emptyListSubText}>
        {onlyFollowing 
          ? "Start following users to see them here!" 
          : isFavoritesList 
            ? "Explore users and follow them!" 
            : "Please check back later or try refreshing."}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* <SearchBar /> */}
      <FilterButtons
        filters={filters}
        activeFilter={activeFilter}
        onFilterPress={handleFilterPress}
      />
      <View style={styles.arrowContainer}>
        <Ionicons name="arrow-forward" size={24} color="black" />
      </View>
      {users.length === 0 && !loading && !refreshing ? (
        renderEmptyList()
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={true}
          data={users}
          renderItem={renderDestinationItem}
          keyExtractor={(item) => item.id}
          onEndReached={() => setPage(prevPage => prevPage + 1)}
          onEndReachedThreshold={0.1}
          ListFooterComponent={() => loading && <ActivityIndicator size="large" color="#0000ff" style={{ marginTop: 20, alignContent:'center' }} />}
          contentContainerStyle={styles.listContent}
          snapToInterval={ITEM_WIDTH + 20}
          decelerationRate="fast"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? '80%' : '100%',
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
    overflow: 'visible',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    height: 100,
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
    bottom: -25,
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
  followButton: {
    backgroundColor: '#6bb2be',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  unfollowButton: {
    backgroundColor: '#FF4040',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    alignSelf: 'center',
  },
});