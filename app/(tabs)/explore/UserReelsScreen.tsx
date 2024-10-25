import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { User, Video, fetchVideosUser } from '../../../api/destinationsApi';
import { useLocalSearchParams, useRouter } from 'expo-router';
import StackHeader from '@/app/components/StackHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoList } from '@/app/components/VideoComponents/VideoList';
import { useDispatch, useSelector } from 'react-redux';
import { setVideosUser, setCurrentIndex } from '@/Redux/videosSlice';
import { RootState } from '@/Redux/store';

export default function UserReelsScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useLocalSearchParams();
  const [userData, setUserData] = useState<User | null>(null);

  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  const userVideos = useSelector((state: RootState) => state.videos.userVideos);

  useEffect(() => {
    if (user) {
      const parsedUser: User = typeof user === 'string' ? JSON.parse(user) : user;
      setUserData(parsedUser);
      checkFavoriteStatus(parsedUser.id);
      loadUserVideos(parsedUser.id);
    }
  }, [user]);

  const checkFavoriteStatus = async (userId: string) => {
    const favorites = await AsyncStorage.getItem('favorites');
    if (favorites) {
      const favoritesArray = JSON.parse(favorites);
      setIsFavorite(favoritesArray.some((fav: User) => fav.id === userId));
    }
  };

  const loadUserVideos = async (userId: string) => {
    try {
      const fetchedVideos = await fetchVideosUser(userId);
      dispatch(setVideosUser(fetchedVideos));
    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async () => {
    try {
      const favorites = await AsyncStorage.getItem('favorites');
      let favoritesArray = favorites ? JSON.parse(favorites) : [];
      
      if (isFavorite) {
        favoritesArray = favoritesArray.filter((fav: User) => fav.id !== userData?.id);
      } else {
        favoritesArray.push(userData);
      }
      
      await AsyncStorage.setItem('favorites', JSON.stringify(favoritesArray));
      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error saving favorite:', error);
    }
  };

  const handleVideoPress = (video: Video) => {
    const index = userVideos.findIndex(v => v.id === video.id);
    dispatch(setCurrentIndex(index));
    router.push({
      pathname: '/(tabs)/explore/SwipeableVideoFeedScreen',
      params: {
        videos: userVideos.map(v => v.downloadURL),
        initialIndex: index,
      },
    });
  };

  const handleRefresh = async () => {
    setLoading(true);
    if (userData) {
      await loadUserVideos(userData.id);
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
        loadUserVideos(parsedUser.id);
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
      <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
        <Text>{isFavorite ? '❌ Unfollow' : '⭐ Follow'}</Text>
            </TouchableOpacity>
          </View> 
        </View>
      )}
      {loading ? (
        <Text style={styles.loadingText}>Loading videos...</Text>
      ) : (
        <VideoList
          videos={userVideos}
          onVideoPress={handleVideoPress}
          onRefresh={() => userData ? loadUserVideos(userData.id) : Promise.resolve()}
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
});