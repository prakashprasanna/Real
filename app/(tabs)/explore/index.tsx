import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from '../../components/SearchBar';
import DestinationList from '../../components/DestinationList';
import LocationDisplay from '../../components/LocationDisplay';
import { useLocation } from '../../../hooks/useLocation';
import StackHeader from '@/app/components/StackHeader';
import { VideoList } from '../../components/VideoComponents/VideoList'; 
import { useRouter } from 'expo-router';
import { Destination, fetchDestinations, fetchVideos, Video } from '../../../api/destinationsApi';
import { useDispatch } from 'react-redux';
import { setVideos } from '../../../Redux/videosSlice';
import { useSelector } from 'react-redux';
import { RootState } from '../../../Redux/store';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const { location, errorMsg } = useLocation();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [videoss, setVideoss] = useState<Video[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth?.userId);


  useEffect(() => {
    loadDestinations();
    if (userId) {
      loadVideos();
    }
  }, [userId]);

  const loadVideos = async () => {
    if (!userId) return;
    try {
      const fetchedVideos = await fetchVideos(userId);
      if (fetchedVideos) {
        dispatch(setVideos(fetchedVideos));
        console.log('Videos loaded:', fetchedVideos);
        setVideoss(fetchedVideos);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const handleRefresh = async () => {
    console.log("Starting video refresh...");
    if (!userId) return;
    try {
      const refreshedVideos = await fetchVideos(userId);
      if (refreshedVideos) {
        dispatch(setVideos(refreshedVideos));
        setVideoss(refreshedVideos);
        console.log('Videos refreshed:', refreshedVideos);
      }
    } catch (error) {
      console.error('Failed to refresh videos:', error);
    }
  };
  const loadDestinations = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const newDestinations = await fetchDestinations(page, 10);
      setDestinations([...destinations, ...newDestinations]);
      setPage(page + 1);
    } catch (error) {
      console.error('Error fetching destinations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoPress = (video: Video) => {
    router.push({
      pathname: '/(tabs)/explore/FullVideoScreen',
      params: { uri: video.downloadURL }
    });
  };


  return (
    <>
    <StackHeader detail={'Explore'} />
    <View style={styles.container}>
      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />
      <DestinationList
        destinations={destinations}
        onLoadMore={loadDestinations}
        loading={loading}
      />
      <VideoList 
        videos={videoss} 
        onVideoPress={handleVideoPress}  
        onRefresh={handleRefresh}
      />
    </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
    backgroundColor: '#f0f0f0',
  },
});