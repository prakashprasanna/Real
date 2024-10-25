import React, { useCallback, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideos } from '@/api/destinationsApi';
import { setVideos, setLoading } from '@/Redux/videosSlice';
import { RootState } from '@/Redux/store';
import { auth } from '@/firebaseConfig';
const REFRESH_INTERVAL = 1 * 60 * 1000; // 1 minute

export default function TabLayout() {
  const { cart } = useCart();
  const router = useRouter();
  const dispatch = useDispatch();
  const lastFetchTime = useSelector((state: RootState) => state.videos.lastFetchTime);
  const videos = useSelector((state: RootState) => state.videos.videos);
  const isLoading = useSelector((state: RootState) => state.videos.isLoading);
  const userId = auth.currentUser?.uid;

  const fetchVideosIfNeeded = useCallback(async () => {
    const userId = auth.currentUser?.uid;
    console.log('Fetching videos if needed...', userId);
    
    if (!userId) {
      console.log('No user logged in. Skipping video fetch.');
      return;
    }

    const now = Date.now();
    const shouldFetch = !lastFetchTime || now - lastFetchTime > REFRESH_INTERVAL || videos.length === 0;

    if (shouldFetch) {
      console.log('Fetching videos...');
      dispatch(setLoading(true));
      
      try {
        const refreshedVideos = await fetchVideos();
        console.log('Fetched videos:', refreshedVideos.length);
        dispatch(setVideos(refreshedVideos));
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        // Optionally, you could dispatch an action to set an error state
      } finally {
        dispatch(setLoading(false));
      }
    } else {
      console.log('Using cached videos. Count:', videos.length);
    }
  }, [dispatch, lastFetchTime, videos.length]);

  useEffect(() => {
    fetchVideosIfNeeded();
  }, []);

  const handleExplorePress = useCallback(() => {
    dispatch(setLoading(true));
    router.push('/(tabs)/explore');
    // setTimeout(() => {
    //   fetchVideosIfNeeded().then(() => {
    //     dispatch(setLoading(false));
    //   });
    // }, 0);
  }, [dispatch, fetchVideosIfNeeded, router]);

  const handleCartPress = () => {
    router.push('/cart');
  };

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: '#6bb2be' },
        tabBarActiveTintColor: '#ffffff',
        tabBarInactiveTintColor: '#cccccc',
      }}
    >
      <Tabs.Screen
        name="explore/index"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => (
            isLoading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Ionicons name="search" size={24} color={'#fff'} />
            )
          ),
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={handleExplorePress} />
          ),
        }}
      />
      <Tabs.Screen
        name="Favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color }) => <Ionicons name="star" size={24} color={'#fff'} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Add Video',
          tabBarIcon: ({ color }) => <Ionicons name="videocam" size={24} color={'#fff'} />,
          tabBarButton: (props) => (
            <TouchableOpacity {...props} onPress={handleCartPress} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color }) => <Ionicons name="mail" size={24} color={'#fff'} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person" size={24} color={'#fff'} />,
        }}
      />
      <Tabs.Screen name="explore/UserReelsScreen" options={{ href: null }} />
      <Tabs.Screen name="PaymentScreen" options={{ href: null }} />
      <Tabs.Screen 
        name="explore/FullVideoScreen" 
        options={{ 
          href: null,
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }} 
      />
      <Tabs.Screen name="explore/SwipeableVideoFeedScreen" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="EditProfile" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}