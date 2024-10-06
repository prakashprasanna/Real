import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import SearchBar from '../../components/SearchBar';
import DestinationList from '../../components/DestinationList';
import { useLocation } from '../../../hooks/useLocation';
import StackHeader from '@/app/components/StackHeader';
import { VideoList } from '../../components/VideoComponents/VideoList'; 
import { useRouter } from 'expo-router';
import { Destination, fetchDestinations, fetchVideos, Video, deleteVideoAPI } from '../../../api/destinationsApi';
import { useDispatch, useSelector } from 'react-redux';
import { setVideos, deleteVideo } from '../../../Redux/videosSlice';
import { RootState } from '../../../Redux/store';
import { auth } from '@/firebaseConfig';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const { location, errorMsg } = useLocation();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();
  const userId = auth.currentUser?.uid;
  const videos = useSelector((state: RootState) => state.videos.videos);

  useEffect(() => {
    loadDestinations();
    if (userId) {
      loadVideos();
    }
  }, [userId]);

  const loadVideos = async () => {
    if (!userId) return;
    try {
      const fetchedVideos = await fetchVideos();
      if (fetchedVideos) {
        dispatch(setVideos(fetchedVideos));
        console.log('Videos loaded:', fetchedVideos);
      }
    } catch (error) {
      console.error('Failed to load videos:', error);
    }
  };

  const handleRefresh = async () => {
    console.log("Starting video refresh...");
    if (!userId) return;
    try {
      const refreshedVideos = await fetchVideos();
      if (refreshedVideos) {
        dispatch(setVideos(refreshedVideos));
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

  const handleDeleteVideo = async (videoId: string) => {
    try {
      // Assuming you have a deleteVideo function in your API
      await deleteVideoAPI(videoId);
      dispatch(deleteVideo(videoId));
      console.log('Video deleted:', videoId);
    } catch (error) {
      console.error('Failed to delete video:', error);
    }
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
          videos={videos} 
          onVideoPress={handleVideoPress}  
          onRefresh={handleRefresh}
          onDeleteVideo={handleDeleteVideo}
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