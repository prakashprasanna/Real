import React, { useState, useCallback, useEffect } from 'react';
import { Platform, View } from 'react-native';
import SearchBar from './SearchBar';
import UsersList from './UsersList';
import { User, fetchUsers, followUser, unfollowUser } from '../../api/destinationsApi';

const UsersContainer: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Add this state

  const loadUsers = useCallback(async (page: number, pageSize: number, onlyFollowing: boolean) => {
    console.log(`[UsersContainer] Fetching users. Page: ${page}, PageSize: ${pageSize}, OnlyFollowing: ${onlyFollowing}`);
    try {
      const fetchedUsers = await fetchUsers(page, pageSize, onlyFollowing);
      console.log(`[UsersContainer] Fetched users:`, fetchedUsers);
      return fetchedUsers || [];
    } catch (error) {
      console.error('[UsersContainer] Error fetching users:', error);
      return [];
    }
  }, []);

  // Update this useEffect to depend on refreshTrigger
  useEffect(() => {
    loadUsers(1, 10, true).then(setUsers);
  }, [loadUsers, refreshTrigger]);

  const handleFollowUnfollow = useCallback(async (userId: string, isFollowed: boolean) => {
    try {
      if (isFollowed) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
      // Trigger a refresh after follow/unfollow
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error(`Error ${isFollowed ? 'unfollowing' : 'following'} user:`, error);
    }
  }, []);

  const getLatestUserData = useCallback((userId: string) => {
    return users.find(user => user.id === userId);
  }, [users]);
  
  return (
    <View style={{ height: Platform.OS === 'ios' ? '40%' : '45%'}}>
      <SearchBar 
        users={users} 
        onFollowUnfollow={handleFollowUnfollow} 
        getLatestUserData={getLatestUserData}
        setUsers={setUsers}
      />
      <UsersList 
        users={users} 
        setUsers={setUsers} 
        onFollowUnfollow={handleFollowUnfollow} 
        loadUsers={loadUsers}
        key={refreshTrigger} // Add this to force re-render
      />
    </View>
  );
};

export default UsersContainer;