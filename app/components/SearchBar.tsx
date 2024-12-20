import React, { useState, useEffect, useCallback } from 'react';
import { TextInput, StyleSheet, View, FlatList, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { User, fetchUsers, followUser, unfollowUser } from '../../api/destinationsApi';
import { useRouter } from 'expo-router';

interface SearchBarProps {
  users: User[];
  onFollowUnfollow: (userId: string, isFollowed: boolean) => Promise<void>;
  getLatestUserData: (userId: string) => User | undefined;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const SearchBar: React.FC<SearchBarProps> = ({ users, onFollowUnfollow, getLatestUserData, setUsers }) => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const fetchAllUsers = useCallback(async () => {
    const users = await fetchUsers(1, 100, false, true);
    console.log('[SearchBar] Fetched all users:', users);
    setAllUsers(users);
  }, []);

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (text: string) => {
    const filteredUsers = allUsers.filter(user => 
      user.firstName.toLowerCase().includes(text.toLowerCase()) ||
      user.lastName.toLowerCase().includes(text.toLowerCase())
    );
    console.log('[SearchBar] Filtered users:', filteredUsers);
    setSearchResults(filteredUsers);
    setShowResults(true);
  };

  const handleUserPress = (user: User) => {
    router.push({
      pathname: '/(tabs)/explore/UserReelsScreen',
      params: { 
        user: JSON.stringify({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          profileImageUrl: user.profileImageUrl,
        })
      }
    });
    setSearchQuery('');
    setShowResults(false);
  };

  const handleFollowUnfollowUser = async (userId: string, isFollowed: boolean) => {
    try {
      await onFollowUnfollow(userId, isFollowed);
      // Refetch all users to get updated data
      await fetchAllUsers();
      // Re-run search to update results
      if (searchQuery.length > 2) {
        handleSearch(searchQuery);
      }
    } catch (error) {
      console.error('[SearchBar] Error in follow/unfollow:', error);
    }
  };

  const renderSearchResult = ({ item }: { item: User }) => {
    const latestUserData = getLatestUserData(item.id) || item;
    return (
      <View style={styles.resultItem}>
        <TouchableOpacity
          style={styles.nameContainer}
          onPress={() => handleUserPress(latestUserData)}
        >
          <Text style={styles.resultName}>{`${latestUserData.firstName} ${latestUserData.lastName}`}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.followButton, latestUserData.isFollowed ? styles.unfollowButton : null]}
          onPress={() => handleFollowUnfollowUser(latestUserData.id, latestUserData.isFollowed || false)}
        >
          <Text style={styles.followButtonText}>
            {latestUserData.isFollowed ? 'Unfollow' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.icon} />
        <TextInput
          style={styles.input}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search Users..."
          placeholderTextColor="#888"
          returnKeyType="search"
        />
      </View>
      {showResults && (
        <View style={styles.resultsContainer}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>Search Results</Text>
            <TouchableOpacity 
              onPress={() => {
                setShowResults(false);
                setSearchQuery('');
              }}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyResult}>No results found</Text>}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 10,
    marginVertical: 10,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 10,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  resultsContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    maxHeight: 300,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  nameContainer: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
  },
  followButton: {
    backgroundColor: '#6bb2be',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  unfollowButton: {
    backgroundColor: '#ccc',
  },
  followButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  emptyResult: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#888',
    paddingBottom: 20,
  },
  followedButton: {
    backgroundColor: '#ccc',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
});

export default SearchBar;