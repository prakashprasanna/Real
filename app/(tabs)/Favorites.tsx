import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Image, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { User, fetchFollowData } from '../../api/destinationsApi';
import { Ionicons } from '@expo/vector-icons';  
import { useRouter } from 'expo-router';

interface TabProps {
  title: string;
  active: boolean;
  onPress: () => void;
}

const Tab: React.FC<TabProps> = ({ title, active, onPress }) => (
  <TouchableOpacity 
    style={[styles.tab, active && styles.activeTab]} 
    onPress={onPress}
  >
    <Text style={[styles.tabText, active && styles.activeTabText]}>{title}</Text>
  </TouchableOpacity>
);

export default function FavoritesScreen() {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter(); 

  const loadFollowData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFollowData();
      setFollowers(data.followers);
      setFollowing(data.following);
    } catch (error) {
      console.error('Error loading follow data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFollowData();
    }, [loadFollowData])
  );

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.userItem}>
      <TouchableOpacity 
        style={styles.userContentContainer}
        onPress={() => {
          router.push({
            pathname: '/(tabs)/explore/UserReelsScreen',
            params: { 
              user: JSON.stringify({
                id: item.id,
                firstName: item.firstName,
                lastName: item.lastName,
                profileImageUrl: item.profileImageUrl,
              })
            }
          });
        }}
      >
        <Image 
          source={{ uri: item.profileImageUrl }} 
          style={styles.userImage} 
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{`${item.firstName} ${item.lastName}`}</Text>
        </View>
      </TouchableOpacity>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => {
            router.push({
              pathname: '/(tabs)/chat/ChatScreen',
              params: { 
                userId: item.id,
                userName: `${item.firstName} ${item.lastName}`
              }
            });
          }}
        >
          <Ionicons name="chatbubble-outline" size={24} color="#6bb2be" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => {
            // Handle call action
            console.log('Call:', item.firstName);
          }}
        >
          <Ionicons name="call-outline" size={24} color="#6bb2be" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <Tab 
          title={`Followers (${followers.length})`} 
          active={activeTab === 'followers'} 
          onPress={() => setActiveTab('followers')}
        />
        <Tab 
          title={`Following (${following.length})`} 
          active={activeTab === 'following'} 
          onPress={() => setActiveTab('following')}
        />
      </View>

      <FlatList
        data={activeTab === 'followers' ? followers : following}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {loading 
              ? 'Loading...' 
              : `No ${activeTab} yet`
            }
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#6bb2be',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#6bb2be',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  userContentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconButton: {
    padding: 5,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
});