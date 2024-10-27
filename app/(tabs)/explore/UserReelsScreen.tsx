import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Video, checkIfFollowing, fetchVideosUser, followUser, unfollowUser } from '../../../api/destinationsApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StackHeader from '@/app/components/StackHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoList } from '@/app/components/VideoComponents/VideoList';
import { useDispatch, useSelector } from 'react-redux';
import { setVideos, setVideosUser, setCurrentIndex } from '@/Redux/videosSlice';
import { RootState } from '@/Redux/store';

export default function UserReelsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useLocalSearchParams();
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);

  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const { videos, userVideos } = useSelector((state: RootState) => state.videos);
  const loggedInUserId = useSelector((state: RootState) => state.auth.userId);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    console.log("UserReelsScreen: Component mounted or user changed");
    console.log("Raw user data:", user);
    if (user) {
      const parsedUser: User = typeof user === 'string' ? JSON.parse(user) : user;
      console.log("Parsed User:", parsedUser);
      console.log("Logged In User ID:", loggedInUserId);
      const isLoggedIn = parsedUser.id === loggedInUserId;
      console.log("Is Logged In User:", isLoggedIn);
      setUserData(parsedUser);
      setIsLoggedInUser(isLoggedIn);
      checkFollowStatus(parsedUser.id);
      loadUserVideos(parsedUser.id, isLoggedIn);
    }
  }, [user, loggedInUserId]);

  const checkFollowStatus = async (userId: string) => {
    // This function should check if the logged-in user is following the viewed user
    // You'll need to implement this in your API
    const isFollowing = await checkIfFollowing(userId);
    setIsFollowing(isFollowing);
  };

  const loadUserVideos = async (userId: string, isLoggedIn: boolean) => {
    console.log("loadUserVideos called with userId:", userId, "isLoggedIn:", isLoggedIn);
    try {
      setLoading(true);
      const fetchedVideos = await fetchVideosUser(userId);
      console.log("Fetched videos:", fetchedVideos.length);
      if (isLoggedIn) {
        console.log("Dispatching setVideos");
        dispatch(setVideos(fetchedVideos));
      } else {
        console.log("Dispatching setVideosUser");
        dispatch(setVideosUser(fetchedVideos));
      }
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (video: Video) => {
    console.log("handleVideoPress called in UserReelsScreen with video:", video.id);
    console.log("isLoggedInUser:", isLoggedInUser);
    const videosToUse = isLoggedInUser ? videos : userVideos;
    console.log("Videos to use:", videosToUse.length);
    const index = videosToUse.findIndex(v => v.id === video.id);
    console.log("Video index:", index);
    dispatch(setCurrentIndex(index));
    
    const params = {
      isLoggedInUser: isLoggedInUser.toString(),
      initialIndex: index.toString(),
    };
    console.log("Navigating to SwipeableVideoFeedScreen with params:", params);
    
    try {
      router.push({
        pathname: '/(tabs)/explore/SwipeableVideoFeedScreen',
        params: params,
      });
      console.log("Navigation completed");
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  const checkFavoriteStatus = async (userId: string) => {
    const favorites = await AsyncStorage.getItem('favorites');
    if (favorites) {
      const favoritesArray = JSON.parse(favorites);
      setIsFavorite(favoritesArray.some((fav: User) => fav.id === userId));
    }
  };

  const toggleFollow = async () => {
    if (!userData) return;
  
    try {
      if (isFollowing) {
        await unfollowUser(userData.id);
      } else {
        await followUser(userData.id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Error toggling follow status:', error);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    if (userData) {
      await loadUserVideos(userData.id, isLoggedInUser);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    // Implement delete functionality if needed
    console.log('Delete video:', videoId);
  };

  useEffect(() => {
    console.log('Raw user data:', user);
    if (user) {
      let parsedUser: User;
      try {
        parsedUser = typeof user === 'string' ? JSON.parse(user) : user;
        console.log('Parsed User Data:', parsedUser);
        console.log('Profile Image URL:', parsedUser.profileImageUrl);
        setUserData(parsedUser);
        checkFavoriteStatus(parsedUser.id);
        loadUserVideos(parsedUser.id, isLoggedInUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    } else {
      console.log('No user data received');
    }
  }, [user]);

  return (
    <View style={styles.container}>
      <StackHeader detail={'User Reels'} />
      {userData && (
        <View style={styles.userInfoContainer}>
          {userData.profileImageUrl ? (
            <Image 
        source={{ uri: userData.profileImageUrl }}
        style={styles.profileImage}
        onError={(e) => console.log('Image loading error:', JSON.stringify(e.nativeEvent, null, 2))}
      />
    ) : (
      <View style={[styles.profileImage, { backgroundColor: '#ccc', justifyContent: 'center', alignItems: 'center' }]}>
        <Text>{userData.firstName[0]}{userData.lastName[0]}</Text>
      </View>
    )}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{`${userData.firstName} ${userData.lastName}`}</Text>
          <TouchableOpacity onPress={toggleFollow} style={isFollowing ? styles.followButton : styles.unFollowButton}>
            <Text>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
          </TouchableOpacity>
        </View> 
      </View>
      )}
      {loading ? (
        <Text style={styles.loadingText}>Loading videos...</Text>
      ) : (
        <VideoList
          videos={isLoggedInUser ? videos : userVideos}
          onVideoPress={handleVideoPress}
          onRefresh={() => userData ? loadUserVideos(userData.id, isLoggedInUser) : Promise.resolve()}
          onDeleteVideo={handleDeleteVideo}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  userInfoContainer: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0', // Add a background color
  },
  userInfo: {
    marginLeft: 20,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  favoriteButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  followButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#ff474c',
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  unFollowButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#6bb2be',
    borderRadius: 5,
    alignSelf: 'flex-start',
  },
  followButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
});