import React, { useCallback, useState, useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '@/hooks/useCart';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVideos } from '@/api/destinationsApi';
import { setVideos, setLoading } from '@/Redux/videosSlice';
import { RootState } from '@/Redux/store';

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export default function TabLayout() {
  const { cart } = useCart();
  const router = useRouter();
  const dispatch = useDispatch();
  const lastFetchTime = useSelector((state: RootState) => state.videos.lastFetchTime);
  const videos = useSelector((state: RootState) => state.videos.allVideos);
  const isLoading = useSelector((state: RootState) => state.videos.isLoading);

  const fetchVideosIfNeeded = useCallback(async () => {
    const now = Date.now();
    if (!lastFetchTime || now - lastFetchTime > REFRESH_INTERVAL || videos.length === 0) {
      dispatch(setLoading(true));
      try {
        const refreshedVideos = await fetchVideos();
        if (refreshedVideos) {
          dispatch(setVideos(refreshedVideos));
        }
      } catch (error) {
        console.error('Failed to refresh videos:', error);
      } finally {
        dispatch(setLoading(false));
      }
    }
  }, [dispatch, lastFetchTime, videos]);

  useEffect(() => {
    fetchVideosIfNeeded();
  }, [fetchVideosIfNeeded]);

  const handleExplorePress = useCallback(() => {
    dispatch(setLoading(true)); // Set loading to true immediately
    router.push('/(tabs)/explore');
    // Use setTimeout to ensure this runs after navigation is complete
    setTimeout(() => {
      fetchVideosIfNeeded().then(() => {
        dispatch(setLoading(false));
      });
    }, 0);
  }, [dispatch, fetchVideosIfNeeded, router]);

  const handleCartPress = () => {
    router.push('/cart');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

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
      {/* <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarIcon: ({ color }) => (
            <View>
              <Ionicons name="cart" size={24} color={'#fff'} />
              {cartItemCount > 0 && (
                <View style={{
                  position: 'absolute',
                  right: -6,
                  top: -3,
                  backgroundColor: 'red',
                  borderRadius: 7,
                  width: 14,
                  height: 14,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {cartItemCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      /> */}
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
      <Tabs.Screen name="explore/DestinationDetailScreen" options={{ href: null }} />
      <Tabs.Screen name="PaymentScreen" options={{ href: null }} />
      <Tabs.Screen name="explore/FullVideoScreen" options={{ href: null,headerShown: false }} />
      <Tabs.Screen name="explore/SwipeableVideoFeedScreen" options={{ href: null,headerShown: false }} />
    </Tabs>
  );
}
